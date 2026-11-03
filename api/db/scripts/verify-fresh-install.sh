#!/usr/bin/env bash
#
# Regression check: a completely empty database must be buildable with the stock
# `npm run db:init` lifecycle (create-db -> migrate -> seed).
#
# This broke once already: 20260309032638_add_voting_tables inserted the Mayor Election
# rows itself, and `place_id` is a foreign key into `place`, which seeds only fill in
# afterwards. Every existing database had the migration recorded so knex never re-ran it,
# and the breakage stayed invisible until someone set up from scratch.
#
#   CTR_FRESH_DB_TEST=1 api/db/scripts/verify-fresh-install.sh
#
# Requires docker. It brings up its own throwaway mysql:5.7 and node:14 containers and
# removes them again; it never reads DB_HOST/DB_DATABASE, so it cannot be pointed at a
# database you care about.

set -euo pipefail

if [ "${CTR_FRESH_DB_TEST:-}" != "1" ]; then
  echo "Refusing to run: this test creates and destroys databases." >&2
  echo "Set CTR_FRESH_DB_TEST=1 to confirm that is what you want." >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SUFFIX="$$-$(date +%s)"
CONTAINER="ctr-fresh-db-${SUFFIX}"
NETWORK="ctr-fresh-db-net-${SUFFIX}"
DB_NAME="ctr_fresh_db_test"
MYSQL_PASS="pw"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

mysql_exec() {
  docker exec -i "$CONTAINER" mysql -uroot -p"$MYSQL_PASS" --batch --skip-column-names "$@" 2>/dev/null
}

# Runs a command in a throwaway node:14 container wired to the disposable database.
# The env vars are set on the process, and dotenv never overwrites an existing value, so a
# developer's own api/.env cannot redirect this at another server.
in_node() {
  docker run --rm --network "$NETWORK" \
    -u "$(id -u):$(id -g)" -e HOME=/tmp \
    -e NODE_ENV=development \
    -e DB_HOST="$CONTAINER" -e DB_PORT=3306 \
    -e DB_USER=root -e DB_PASS="$MYSQL_PASS" -e DB_DATABASE="$DB_NAME" \
    -e JWT_SECRET=fresh-db-test \
    -v "$REPO_ROOT":/usr/src/app -w /usr/src/app/api \
    node:14 bash -c "$1"
}

echo "==> starting disposable mysql:5.7 ($CONTAINER)"
docker network create "$NETWORK" >/dev/null
docker run -d --name "$CONTAINER" --network "$NETWORK" \
  -e MYSQL_ROOT_PASSWORD="$MYSQL_PASS" mysql:5.7 >/dev/null

for _ in $(seq 1 90); do
  if mysql_exec -e "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 2
done
mysql_exec -e "SELECT VERSION()" >/dev/null 2>&1 || fail "mysql never became reachable"
echo "    mysql $(mysql_exec -e 'SELECT VERSION()') is up, database $DB_NAME does not exist yet"

if [ ! -d "$REPO_ROOT/api/node_modules" ]; then
  echo "==> installing api dependencies"
  in_node "npm install --no-audit --no-fund" >/dev/null
fi

echo "==> npm run db:init against the empty database"
INIT_LOG="$(mktemp)"
if ! in_node "npm run db:init" >"$INIT_LOG" 2>&1; then
  sed -n '1,80p' "$INIT_LOG" >&2
  fail "db:init did not complete on an empty database"
fi

# Every migration on disk must be recorded, and every seed file must have run.
# The counts are compared as strings against MySQL output, and `wc -l` pads its result with
# leading blanks on some platforms, so strip everything that is not a digit first.
count_files() { find "$1" -maxdepth 1 -name "$2" | wc -l | tr -cd '0-9'; }
MIGRATIONS_ON_DISK="$(count_files "$REPO_ROOT/api/db/migrations" '*.ts')"
SEEDS_ON_DISK="$(count_files "$REPO_ROOT/api/db/seed" '*.seed.ts')"
MIGRATIONS_RECORDED="$(mysql_exec "$DB_NAME" -e "SELECT COUNT(*) FROM migrations")"
SEEDS_RAN="$(grep -oE 'Ran [0-9]+ seed files' "$INIT_LOG" | grep -oE '[0-9]+' | tail -1)"

echo "    migrations: $MIGRATIONS_RECORDED recorded / $MIGRATIONS_ON_DISK on disk"
echo "    seeds:      ${SEEDS_RAN:-0} ran / $SEEDS_ON_DISK on disk"
[ "$MIGRATIONS_RECORDED" = "$MIGRATIONS_ON_DISK" ] || fail "not every migration was applied"
[ "${SEEDS_RAN:-0}" = "$SEEDS_ON_DISK" ] || fail "not every seed ran"

# The poll has to exist, and it has to hang off the canonical place rather than whichever
# row happened to get id 1.
POLL="$(mysql_exec "$DB_NAME" -e "
  SELECT COUNT(*) FROM vote_list v
  JOIN place p ON p.id = v.place_id
  WHERE v.title = 'Mayor Election 2026' AND p.slug = 'enter'")"
OPTIONS="$(mysql_exec "$DB_NAME" -e "
  SELECT COUNT(*) FROM vote_options o
  JOIN vote_list v ON v.id = o.vote_id
  WHERE v.title = 'Mayor Election 2026'")"
ORPHANS="$(mysql_exec "$DB_NAME" -e "
  SELECT COUNT(*) FROM vote_options o
  LEFT JOIN vote_list v ON v.id = o.vote_id WHERE v.id IS NULL")"

echo "    Mayor Election polls at slug 'enter': $POLL, options: $OPTIONS, orphaned options: $ORPHANS"
[ "$POLL" = "1" ] || fail "expected exactly one Mayor Election poll attached to place 'enter'"
[ "$OPTIONS" = "3" ] || fail "expected 3 options on the Mayor Election poll, got $OPTIONS"
[ "$ORPHANS" = "0" ] || fail "vote_options rows point at a poll that does not exist"

# ---------------------------------------------------------------------------------------
# Second half: the states 12-votes.seed.ts can find when it is not run on a fresh database.
#
# Skipping on the title alone was not enough. The poll row and its options are two separate
# inserts, so a crash between them used to leave an election with no options that every
# later seed run happily skipped. These cases pin down the transaction and the validation.
# ---------------------------------------------------------------------------------------
SEED_LOG="$(mktemp)"

run_votes_seed() {
  in_node "npx knex seed:run --knexfile src/knexfile.ts --specific=12-votes.seed.ts" \
    >"$SEED_LOG" 2>&1
}

polls()   { mysql_exec "$DB_NAME" -e "SELECT COUNT(*) FROM vote_list WHERE title = 'Mayor Election 2026'"; }
# Scoped to the Mayor Election by title rather than counting the whole table: an unrelated
# poll seeded later must not make these assertions fail. The id is looked up, never assumed.
options() { mysql_exec "$DB_NAME" -e "
  SELECT COUNT(*) FROM vote_options o
  JOIN vote_list v ON v.id = o.vote_id
  WHERE v.title = 'Mayor Election 2026'"; }

# Back to the canonical one-poll/three-option state, whatever the previous case did to it.
reset_votes() {
  mysql_exec "$DB_NAME" -e "DELETE FROM vote_response; DELETE FROM vote_options; DELETE FROM vote_list;"
  run_votes_seed || { sed -n '1,40p' "$SEED_LOG" >&2; fail "could not rebuild the canonical vote state"; }
}

# The seed must refuse loudly, and for the stated reason -- an exit code alone would also be
# satisfied by an unrelated crash.
expect_seed_fails() {
  local case_name="$1" expected="$2"
  if run_votes_seed; then
    fail "$case_name: the seed reported success on a state it cannot have produced"
  fi
  grep -q "$expected" "$SEED_LOG" || {
    sed -n '1,40p' "$SEED_LOG" >&2
    fail "$case_name: the seed failed, but not with the expected '$expected'"
  }
  echo "    $case_name -- refused, as expected"
}

echo "==> re-running the votes seed on a valid state (must be a clean no-op)"
run_votes_seed || { sed -n '1,40p' "$SEED_LOG" >&2; fail "re-running 12-votes.seed.ts failed"; }
grep -q 'already present and complete, skipping' "$SEED_LOG" \
  || fail "the seed re-ran without recognising the existing poll as complete"
echo "    after rerun -- polls: $(polls), options: $(options)"
[ "$(polls)" = "1" ] || fail "re-running the seed duplicated the poll"
[ "$(options)" = "3" ] || fail "re-running the seed duplicated the options"

echo "==> a crash between the poll insert and the options must roll the poll back"
mysql_exec "$DB_NAME" -e "DELETE FROM vote_response; DELETE FROM vote_options; DELETE FROM vote_list;"
# A trigger is the least invasive way to make the second insert fail for real, without
# reimplementing any of the seed: the seed under test is the shipped file, unmodified.
mysql_exec "$DB_NAME" -e "
  CREATE TRIGGER ctr_block_vote_options BEFORE INSERT ON vote_options
  FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'forced failure: rollback test';"
if run_votes_seed; then fail "the seed survived a forced vote_options failure"; fi
LEFTOVER="$(polls)"
echo "    seed failed as forced; Mayor Election rows left behind: $LEFTOVER"
[ "$LEFTOVER" = "0" ] || fail "the poll row survived a failed options insert -- not atomic"
mysql_exec "$DB_NAME" -e "DROP TRIGGER ctr_block_vote_options;"
run_votes_seed || { sed -n '1,40p' "$SEED_LOG" >&2; fail "the seed could not recover once the failure was removed"; }
echo "    after recovery -- polls: $(polls), options: $(options)"
[ "$(polls)" = "1" ] || fail "recovery did not produce exactly one poll"
[ "$(options)" = "3" ] || fail "recovery did not produce exactly three options"

echo "==> a poll that exists but is malformed must be reported, never skipped"
mysql_exec "$DB_NAME" -e "DELETE FROM vote_options;"
expect_seed_fails "poll with zero options" "options are wrong"

reset_votes
mysql_exec "$DB_NAME" -e "DELETE FROM vote_options ORDER BY id LIMIT 1;"
expect_seed_fails "poll with partial options" "options are wrong"

reset_votes
mysql_exec "$DB_NAME" -e "
  UPDATE vote_list SET place_id = (SELECT id FROM place WHERE slug = 'gameshow' ORDER BY id LIMIT 1)
  WHERE title = 'Mayor Election 2026';"
expect_seed_fails "poll at the wrong place" "Refusing to move an existing poll"

# vote_list.title carries no unique index, so nothing at the schema level stops a second
# election from appearing -- a hand-repaired database or two seed runs racing each other
# can both leave one behind. The seed has to refuse rather than guess which one is real.
reset_votes
mysql_exec "$DB_NAME" -e "
  INSERT INTO vote_list (title, place_id, creator_member_id, description, expires_at)
  SELECT title, place_id, creator_member_id, description, expires_at
  FROM vote_list WHERE title = 'Mayor Election 2026' ORDER BY id LIMIT 1;"
[ "$(polls)" = "2" ] || fail "could not stage the duplicate-poll case"
BEFORE_DUP="$(mysql_exec "$DB_NAME" -e "
  SELECT GROUP_CONCAT(CONCAT_WS(':', id, place_id) ORDER BY id) FROM vote_list
  WHERE title = 'Mayor Election 2026';")"
expect_seed_fails "two polls with the same title" "expected at most one"
# Refusing is only half of it -- the seed must not have edited either poll on its way out.
[ "$(polls)" = "2" ] || fail "the duplicate-poll case changed how many polls exist"
AFTER_DUP="$(mysql_exec "$DB_NAME" -e "
  SELECT GROUP_CONCAT(CONCAT_WS(':', id, place_id) ORDER BY id) FROM vote_list
  WHERE title = 'Mayor Election 2026';")"
[ "$BEFORE_DUP" = "$AFTER_DUP" ] || fail "the seed modified a poll it had refused to touch"
[ "$(options)" = "3" ] || fail "the duplicate-poll case changed the option rows"

reset_votes
echo "    restored -- polls: $(polls), options: $(options)"
[ "$(polls)" = "1" ] || fail "could not restore the canonical poll"
[ "$(options)" = "3" ] || fail "could not restore the canonical options"

echo "PASS: an empty database builds with the stock db:init lifecycle, the poll and its"
echo "      options are written atomically, and a malformed existing poll is never skipped."
