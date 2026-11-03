<template>
  <div class="ctr-checker">
    <div v-if="accessDenied" class="w-full flex h-full justify-center items-center">
      <div class="text-red-500">Access Denied!</div>
    </div>

    <div v-else-if="loadError" class="w-full flex h-full justify-center items-center">
      <div class="text-center">
        <div class="text-red-500 mb-2">{{ loadError }}</div>
        <button class="btn" @click="backToList">Back</button>
      </div>
    </div>

    <template v-else-if="inspection || viewerUrl">
      <!--
        Identity first and largest, then the queue. A checker arriving here
        needs to know what they are looking at and where they are before they
        need any of the technical detail.
      -->
      <header class="ctr-checker-head">
        <div class="ctr-checker-identity">
          <h2 class="ctr-checker-name">{{ inspection ? object.name : 'Loading\u2026' }}</h2>
          <div v-if="inspection" class="ctr-checker-subline">
            <span class="ctr-checker-id">#{{ object.id }}</span>
            <span class="ctr-status-badge">{{ object.statusLabel }}</span>
            <span class="ctr-review-state">{{ reviewStateLabel }}</span>
          </div>
          <dl v-if="inspection" class="ctr-checker-facts">
            <div><dt>Uploaded by</dt><dd>{{ creatorLabel }}</dd></div>
            <div><dt>Price</dt><dd>{{ object.price }} CC</dd></div>
            <div><dt>Quantity</dt><dd>{{ object.quantity }}</dd></div>
            <div><dt>Limit</dt><dd>{{ limitLabel }}</dd></div>
            <div><dt>Store</dt><dd>{{ storeLabel }}</dd></div>
            <div><dt>Uploaded</dt><dd>{{ formatDate(object.createdAt) }}</dd></div>
          </dl>
          <p v-if="inspection" class="ctr-checker-guidance">{{ guidanceLabel }}</p>
        </div>
        <nav class="ctr-checker-queue">
          <div v-if="queueLabel" class="ctr-queue-count">{{ queueLabel }}</div>
          <!--
            The way out sits above the way through: leaving the queue is the
            one control a checker needs to find without looking, and stepping
            through it is what they do once they have already decided to stay.
          -->
          <div class="ctr-queue-step">
            <button class="btn-ui-inline ctr-queue-button" @click="backToList">
              &#9664; Back to {{ fromLabel }}
            </button>
          </div>
          <div v-if="queue.ids.length" class="ctr-queue-step">
            <button class="btn-ui-inline ctr-queue-button"
                    :disabled="!previousId"
                    @click="goTo(previousId)">&#9664; Previous Item</button>
            <button class="btn-ui-inline ctr-queue-button"
                    :disabled="!nextId"
                    @click="goTo(nextId)">Next Item &#9654;</button>
          </div>
          <a class="ctr-queue-secondary"
             :href="ownUrl"
             target="_blank"
             rel="noopener">Open in New Tab</a>
        </nav>
      </header>

      <!-- Inspection panes -->
      <div class="ctr-checker-body">
        <!--
          Preview first, then what was found in it. A checker looks at the
          object before they read about it, so Findings sits directly under
          what it is describing rather than in a separate column.
        -->
        <div class="ctr-pane ctr-pane-primary">
          <!--
            Deliberately NOT inside the `inspection` gate.
            `ObjectViewer` creates exactly one X_ITE browser for its lifetime and
            swaps the Inline's url as `objectUrl` changes, because repeated
            create/dispose cycles leave later browsers unable to load a world at
            all. Rendering it under `v-if="inspection"` destroyed and rebuilt it
            on every Previous/Next -- the exact cycle it was written to avoid --
            so the next object's model often never appeared until a hard refresh.
            It stays mounted across navigation and is handed the new url instead.
          -->
          <div class="ctr-preview">
            <object-viewer v-if="viewerUrl" :object-url="viewerUrl" />
            <div v-else class="h-full flex items-center justify-center text-red-500">
              This object has no stored WRL file.
            </div>
          </div>

          <section v-if="inspection" class="ctr-section ctr-findings">
            <h3 class="ctr-section-head">Findings</h3>
            <div v-if="!inspection.findings.length" class="text-green">
              Nothing flagged. Size, position and content still need your eye.
            </div>
            <template v-else>
              <div v-for="group in findingGroups" :key="group.severity" class="mb-3">
                <div class="ctr-finding-group" :class="group.className">{{ group.label }}</div>
                <ul class="ctr-finding-list">
                  <li v-for="(finding, index) in group.findings" :key="index">
                    <p class="ctr-finding-message">{{ finding.message }}</p>
                    <p class="ctr-finding-code">
                      <span class="opacity-60">Technical:</span> {{ finding.code }}
                    </p>
                  </li>
                </ul>
              </div>
            </template>
            <p class="ctr-note">Advisory only. Nothing here accepts or rejects anything.</p>
          </section>
        </div>

        <!--
          Everything below is the object's record and the actions that change
          it. It is gated on `inspection` so that while the next object loads
          there is nothing on screen describing the previous one, and no
          Accept/Reject/Edit control belonging to an object the checker has
          already left.
        -->
        <div v-if="!inspection" class="ctr-pane ctr-pane-technical">
          <p class="ctr-plain">Loading this object&rsquo;s record&hellip;</p>
        </div>

        <div v-else class="ctr-pane ctr-pane-technical">
          <!--
            The thumbnail is what a buyer sees, so it leads the record column
            and is itself the control that opens the full-size view.
          -->
          <section class="ctr-section">
            <h3 class="ctr-section-head">Thumbnail</h3>
            <div class="ctr-thumb-row">
              <button v-if="object.assets.thumbnail.url"
                      class="ctr-thumb-button"
                      type="button"
                      title="View the full-size thumbnail"
                      @click="openThumbnail">
                <img :src="object.assets.thumbnail.url" alt="Object thumbnail" />
              </button>
              <div v-else class="text-red-500">No thumbnail.</div>
              <p class="ctr-note ml-2">
                Thumbnail as buyers will see it. Select it to view full size.
              </p>
            </div>
          </section>

          <!-- WorldInfo, verbatim -->
          <section class="ctr-section">
            <h3 class="ctr-section-head">WorldInfo</h3>
            <p class="ctr-plain">What the uploader wrote inside the file itself.</p>
            <div v-if="!vrml" class="opacity-60">
              The file could not be read, so there is no WorldInfo to show.
            </div>
            <div v-else-if="!vrml.worldInfo.length" class="text-red-500">
              This object has no WorldInfo node.
            </div>
            <div v-else>
              <div v-for="(node, index) in vrml.worldInfo" :key="index" class="mb-2">
                <div v-if="vrml.worldInfo.length > 1" class="text-xs opacity-60">
                  WorldInfo {{ index + 1 }} of {{ vrml.worldInfo.length }}
                </div>
                <div><span class="opacity-60">title</span> "{{ node.title }}"</div>
                <div v-for="(line, lineIndex) in node.info" :key="lineIndex" class="ml-4">
                  "{{ line }}"
                </div>
              </div>
            </div>
          </section>

          <!-- WorldInfo against the CTR record -->
          <section v-if="comparisons" class="ctr-section">
            <h3 class="ctr-section-head">WorldInfo vs CTR record</h3>
            <p class="ctr-plain">
              Where the file and the Mall submission disagree about the same thing.
            </p>
            <div class="ctr-table-scroll">
              <table class="ctr-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>CTR record</th>
                    <th>WorldInfo</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="comparison in comparisons" :key="comparison.field">
                    <td class="opacity-60">{{ comparison.field }}</td>
                    <td>{{ displayValue(comparison.ctrValue) }}</td>
                    <td>{{ displayValue(comparison.worldInfoValue) }}</td>
                    <td :class="verdictClass(comparison.verdict)">
                      {{ comparison.verdict }}
                      <div v-if="comparison.note" class="text-xs opacity-60">
                        {{ comparison.note }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- File and asset facts -->
          <section class="ctr-section">
            <h3 class="ctr-section-head">File and assets</h3>
            <div class="ctr-table-scroll">
              <table class="ctr-table">
                <tr>
                  <td class="opacity-60">Stored as</td>
                  <td>{{ object.assets.wrl.filename }} ({{ encodingLabel }})</td>
                </tr>
                <tr>
                  <td class="opacity-60">Stored bytes</td>
                  <td>{{ formatBytes(source.storedBytes) }}</td>
                </tr>
                <tr>
                  <td class="opacity-60">Decoded VRML bytes</td>
                  <td>{{ formatBytes(source.decodedBytes) }}</td>
                </tr>
                <tr v-if="vrml">
                  <td class="opacity-60">Header</td>
                  <td :class="vrml.headerIsVrml97 ? '' : 'text-red-500'">{{ vrml.header }}</td>
                </tr>
                <tr>
                  <td class="opacity-60">Texture uploaded</td>
                  <td>{{ object.assets.texture ? object.assets.texture.filename : 'none' }}</td>
                </tr>
                <tr v-if="vrml">
                  <td class="opacity-60">Textures referenced</td>
                  <td>{{ textureList }}</td>
                </tr>
                <tr v-if="vrml && vrml.externalReferences.length">
                  <td class="opacity-60">External references</td>
                  <td class="text-red-500">
                    <div v-for="(reference, index) in vrml.externalReferences" :key="index">
                      {{ reference.value }}
                    </div>
                  </td>
                </tr>
                <tr v-if="vrml && vrml.viewpoints.length">
                  <td class="opacity-60">Viewpoints</td>
                  <td>{{ viewpointList }}</td>
                </tr>
              </table>
            </div>
            <div class="ctr-actions">
              <button class="btn-ui-inline" @click="openRawSource">View Source</button>
              <button class="btn-ui-inline" @click="openFileDetails">File Details</button>
            </div>
            <p v-if="rawSourceError" class="text-red-400 mt-1">{{ rawSourceError }}</p>
          </section>

          <!-- Raw node counts, as facts rather than judgements -->
          <section v-if="vrml" class="ctr-section">
            <h3 class="ctr-section-head">VRML nodes</h3>
            <div v-if="!presentNodes.length" class="opacity-60">
              None of the nodes the Mall rules mention are present.
            </div>
            <div v-else>
              <span v-for="node in presentNodes" :key="node.name" class="inline-block mr-3">
                {{ node.name }}: {{ node.count }}
              </span>
            </div>
            <div v-if="vrml.protoDefinitions.length" class="mt-1">
              <span class="opacity-60">PROTO:</span> {{ vrml.protoDefinitions.join(', ') }}
            </div>
          </section>

          <!-- Staff actions, deliberately separated from everything above -->
          <section class="ctr-section ctr-moderation">
            <h3 class="ctr-section-head ctr-moderation-head">Staff actions</h3>
            <!--
              The reason is required and goes to the uploader verbatim, so it is
              a real field rather than a prompt: staff are writing to a person.
            -->
            <template v-if="canTriage">
              <label class="ctr-field-label" for="reject-reason">Reason for rejection</label>
              <p class="ctr-note">
                Only used when you reject. The uploader is sent this text exactly as typed.
              </p>
              <textarea
                id="reject-reason"
                v-model="rejectReason"
                class="ctr-reason"
                rows="3"
                :maxlength="rejectReasonMax"
                :disabled="isProcessing"
                placeholder="Tell the uploader what needs fixing."
              ></textarea>
            </template>
            <div class="ctr-actions">
              <!--
                Accept and Reject are the Pending triage decisions. The checker
                is also opened from Warehouse, Stocked, Out of Stock and Search,
                and both endpoints mutate status regardless of the current one --
                Reject would delete and refund a stocked object. Editing stays
                available everywhere.
              -->
              <template v-if="canTriage">
                <button class="btn-ui-inline ctr-accept"
                        :disabled="isProcessing"
                        @click="confirmApprove">Accept</button>
                <button class="btn-ui-inline ctr-reject"
                        :disabled="isProcessing"
                        @click="confirmReject">Reject</button>
              </template>
              <span v-else class="ctr-note">
                Accept and Reject apply to pending objects only.
              </span>
              <button class="btn-ui-inline" :disabled="isProcessing" @click="updateName">
                Edit Name
              </button>
              <button class="btn-ui-inline" :disabled="isProcessing" @click="updateLimit">
                Update Limit
              </button>
            </div>
            <p v-if="actionError" class="text-red-500 mt-1">{{ actionError }}</p>
            <p v-else-if="actionSuccess" class="text-green mt-1">{{ actionSuccess }}</p>
            <!--
              A moderation action that could not notify is still complete, so
              this is a warning to follow up by hand, never an invitation to
              press the button again.
            -->
            <p v-if="actionWarning" class="text-yellow-400 mt-1 font-bold">{{ actionWarning }}</p>
          </section>
        </div>
      </div>

      <!-- Full-size thumbnail -->
      <checker-modal v-if="inspection && showThumbnail"
                     :title="`Thumbnail - ${object.name}`"
                     @close="showThumbnail = false">
        <div class="ctr-lightbox">
          <img :src="object.assets.thumbnail.url" alt="Object thumbnail, full size" />
        </div>
      </checker-modal>

      <!--
        Raw VRML in a bounded dialog rather than inline. Owner QA: a real file's
        long lines expanded the page past the Cybertown frame and the whole
        document scrolled sideways. Here the source is the only thing that
        scrolls, and it scrolls inside its own box.
      -->
      <checker-modal v-if="inspection && showRawSource"
                     :title="`Source - ${object.assets.wrl.filename}`"
                     @close="showRawSource = false">
        <template v-slot:actions>
          <label class="ctr-wrap-toggle">
            <input type="checkbox" v-model="wrapSource" />
            Wrap lines
          </label>
        </template>
        <div v-if="rawSourceError" class="text-red-400">{{ rawSourceError }}</div>
        <div v-else-if="rawSource === ''" class="opacity-60">Loading&hellip;</div>
        <!--
          The decoded file, byte for byte. Wrapping changes how it is displayed
          and nothing else -- indentation and newlines are the file's own.
        -->
        <pre v-else
             class="ctr-source"
             :class="wrapSource ? 'ctr-source-wrap' : ''">{{ rawSource }}</pre>
      </checker-modal>

      <!-- Stored-file facts and the downloads that belong with them -->
      <checker-modal v-if="inspection && showFileDetails"
                     title="Stored file details"
                     @close="showFileDetails = false">
        <table class="ctr-table mb-3">
          <tr>
            <td class="opacity-60">Stored filename</td>
            <td>{{ object.assets.wrl.filename }}</td>
          </tr>
          <tr>
            <td class="opacity-60">Encoding</td>
            <td>{{ encodingLabel }}</td>
          </tr>
          <tr>
            <td class="opacity-60">Stored bytes</td>
            <td>{{ formatBytes(source.storedBytes) }}</td>
          </tr>
          <tr>
            <td class="opacity-60">Decoded bytes</td>
            <td>{{ formatBytes(source.decodedBytes) }}</td>
          </tr>
          <tr v-if="source.sha256">
            <td class="opacity-60">SHA-256</td>
            <td class="ctr-hash">{{ source.sha256 }}</td>
          </tr>
          <tr v-if="vrml">
            <td class="opacity-60">Header</td>
            <td>{{ vrml.header }}</td>
          </tr>
          <tr>
            <td class="opacity-60">Texture uploaded</td>
            <td>{{ object.assets.texture ? object.assets.texture.filename : 'none' }}</td>
          </tr>
          <tr v-if="vrml">
            <td class="opacity-60">Textures referenced</td>
            <td>{{ textureList }}</td>
          </tr>
        </table>
        <div class="ctr-actions">
          <button class="btn-ui-inline" :disabled="isDownloading" @click="downloadSource">
            {{ isDownloading ? 'Preparing...' : 'Download decoded .wrl' }}
          </button>
          <!--
            The stored bytes are served as they sit on disk. Gzip is binary, so
            it is offered as a download rather than rendered as text.
          -->
          <a v-if="object.assets.wrl.url"
             class="btn-ui-inline"
             :href="object.assets.wrl.url"
             target="_blank"
             rel="noopener">Download original stored file</a>
          <a v-if="object.assets.texture"
             class="btn-ui-inline"
             :href="object.assets.texture.url"
             target="_blank"
             rel="noopener">Texture</a>
        </div>
      </checker-modal>
    </template>

    <div v-else class="w-full flex h-full justify-center items-center">Loading&hellip;</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import CheckerModal from "@/components/mall/CheckerModal.vue";
import ObjectViewer from "@/components/mall/ObjectViewer.vue";
import {
  REJECT_REASON_MAX,
  objectDisplayName,
  rejectReasonError,
} from "@/pages/mall/staff/mall-actions.mixin";
import { listDefaults, readListState } from "@/pages/mall/staff/list-query";

/**
 * The Mall staff review workspace.
 *
 * Replaces a viewer-only popup that showed no metadata at all. A checker can now
 * see the CTR record, the object's WorldInfo, what its stored file actually is,
 * and where those disagree, without downloading the WRL or opening an external
 * VRML editor.
 */

/** Which list a checker arrived from, and the object status that list shows. */


/** CTR status for an object awaiting Mall review. */
const PENDING_STATUS = 2;

const LIST_STATUS: { [key: string]: number } = {
  pending: PENDING_STATUS,
  warehouse: 3,
  stocked: 1,
};

const LIST_LABELS: { [key: string]: string } = {
  pending: "Pending",
  warehouse: "Warehouse",
  stocked: "Stocked",
  soldout: "Out of Stock",
  search: "Search",
};

/** Node types worth showing a count for, in the order staff read them. */
const REPORTED_NODES = [
  "ImageTexture",
  "PROTO",
  "EXTERNPROTO",
  "Inline",
  "Script",
  "Sound",
  "AudioClip",
  "DirectionalLight",
  "PointLight",
  "SpotLight",
  "Billboard",
  "Viewpoint",
  "TouchSensor",
  "ProximitySensor",
  "TimeSensor",
  "Anchor",
  "hAnim",
];

export default Vue.extend({
  name: "MallChecker",
  components: { CheckerModal, ObjectViewer },
  data() {
    return {
      accessDenied: false,
      loadError: "",
      inspection: null,
      /**
       * The url currently handed to the 3D viewer.
       *
       * Held separately from `inspection` because it must SURVIVE navigation.
       * `inspection` is cleared the moment the route changes so no stale record
       * or moderation control is on screen, but clearing the viewer's url too
       * would unmount `ObjectViewer` and destroy its X_ITE browser -- the
       * create/dispose cycle that component exists to avoid. It stays mounted
       * and is re-pointed once the next inspection resolves.
       */
      viewerUrl: "",
      rawSource: "",
      rawSourceError: "",
      isDownloading: false,
      /**
       * The object each in-flight fetch was issued for.
       *
       * Staff move through the queue faster than an inspection round-trips, and
       * responses are not guaranteed to arrive in the order they were sent. A
       * slow response for a previous object would otherwise be rendered under
       * the current object's id -- the worst possible failure for a page whose
       * whole job is deciding whether to accept or reject what is on screen.
       */
      inspectionFor: null as number | null,
      rawSourceFor: null as number | null,
      showRawSource: false,
      showThumbnail: false,
      showFileDetails: false,
      /**
       * Soft-wrap in the source viewer.
       *
       * Display only. The bytes shown are the decoded file exactly as stored;
       * wrapping changes where the viewport breaks a line and never what the
       * file contains.
       */
      wrapSource: false,
      isProcessing: false,
      actionError: "",
      actionSuccess: "",
      actionWarning: "",
      rejectReason: "",
      rejectReasonMax: REJECT_REASON_MAX,
      queue: {
        ids: [],
        consumed: [],
        total: 0,
        offset: 0,
        limit: 10,
        /** The sort the originating list was using; see `loadQueue`. */
        order: "ASC",
        exhaustedBefore: false,
        exhaustedAfter: false,
      },
    };
  },
  computed: {
    /**
     * NaN for anything that is not a whole positive id.
     *
     * `Number.parseInt` stops at the first non-digit, so `3339-not-an-id` would
     * otherwise resolve to object 3339 and the page would inspect, accept or
     * reject a different object than the url names. The API refuses such ids
     * outright; the checker should not send them in the first place.
     */
    objectId(): number {
      const raw = String(this.$route.params.object_id || "");
      if (!/^[0-9]+$/.test(raw)) {
        return Number.NaN;
      }
      const parsed = Number.parseInt(raw, 10);
      return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
    },
    object(): any {
      return this.inspection.object;
    },
    source(): any {
      return this.inspection.source;
    },
    vrml(): any {
      return this.inspection.vrml;
    },
    comparisons(): any {
      return this.inspection.comparisons;
    },
    from(): string {
      return String(this.$route.query.from || "");
    },
    fromLabel(): string {
      return LIST_LABELS[this.from] || "Mall";
    },
    creatorLabel(): string {
      return this.object.creator.username || "(no creator on record)";
    },
    /** A null limit is how CTR records "no cap", so it is said that way. */
    limitLabel(): string {
      return this.object.limit === null ? "Unlimited" : String(this.object.limit);
    },
    /**
     * A pending object has not been placed anywhere yet, which is a different
     * fact from a stocked object that is in no store. The raw values stay
     * available in the record below; this is the sentence a checker reads.
     */
    storeLabel(): string {
      if (this.object.store) {
        return this.object.store.name;
      }
      return this.object.statusLabel === "Pending" ? "Not assigned yet" : "Not in a store";
    },
    /** What this object's status means, in the words staff use for it. */
    reviewStateLabel(): string {
      switch (this.object.statusLabel) {
      case "Pending":
        return "Awaiting Mall review";
      case "Warehouse":
        return "Accepted, waiting for the next Mall drop";
      case "Stocked":
        return "On sale in the Mall";
      case "Destocked":
        return "Taken off sale";
      case "Removed":
        return "Removed from the Mall";
      default:
        return "";
      }
    },
    guidanceLabel(): string {
      if (this.canTriage) {
        return "Check the model, metadata and listing details before accepting or rejecting.";
      }
      return "Accept and Reject apply to pending objects only. Edits still apply here.";
    },
    encodingLabel(): string {
      if (this.source.encoding === "gzip") {
        return "gzip-compressed VRML";
      }
      if (this.source.encoding === "identity") {
        return "plain VRML";
      }
      return "unreadable";
    },
    textureList(): string {
      if (!this.vrml || !this.vrml.textureReferences.length) {
        return "none";
      }
      return this.vrml.textureReferences.map((reference: any) => reference.value).join(", ");
    },
    viewpointList(): string {
      return this.vrml.viewpoints
        .map((viewpoint: any) => viewpoint.description || viewpoint.defName || "(unnamed)")
        .join(", ");
    },
    presentNodes(): any[] {
      const counts = this.vrml.nodeCounts || {};
      return REPORTED_NODES
        .filter(name => (counts[name] || 0) > 0)
        .map(name => ({ name, count: counts[name] }));
    },
    currentIndex(): number {
      return this.queue.ids.indexOf(this.objectId);
    },
    previousId(): number {
      return this.neighbour(-1);
    },
    nextId(): number {
      return this.neighbour(1);
    },
    /**
     * Findings grouped by severity, most consequential first.
     *
     * "Needs staff review" leads because it means the rest of this page could
     * not be established -- a checker who reads past it is trusting facts the
     * inspection never actually proved. Empty groups are dropped rather than
     * rendered as reassuring empty headings.
     */
    /**
     * Whether this object is awaiting the Pending triage decision.
     *
     * Read from the object's own status rather than the list it was reached
     * from, so a stale `from` in the url cannot re-enable the buttons.
     */
    canTriage(): boolean {
      return !!this.object && this.object.status === PENDING_STATUS;
    },

    findingGroups(): any[] {
      const order = [
        {
          severity: "needs_staff_review",
          label: "Needs staff review",
          className: "text-yellow-400",
        },
        { severity: "warning", label: "Warnings", className: "text-orange-400" },
        { severity: "info", label: "Information", className: "opacity-70" },
      ];
      const findings = (this.inspection && this.inspection.findings) || [];
      return order
        .map(group => ({
          ...group,
          // Findings from an older API build carry no severity; treating them as
          // needing review matches the server's own fallback.
          findings: findings.filter((finding: any) =>
            (finding.severity || "needs_staff_review") === group.severity),
        }))
        .filter(group => group.findings.length > 0);
    },

    queueLabel(): string {
      if (this.currentIndex < 0 || !this.queue.total) {
        return "";
      }
      const position = this.queue.offset + this.currentIndex + 1;
      return `${this.fromLabel} ${position} of ${this.queue.total}`;
    },
    ownUrl(): string {
      return `/#${this.$route.fullPath}`;
    },

  },
  watch: {
    objectId() {
      this.actionError = "";
      this.actionSuccess = "";
      this.actionWarning = "";
      // The reason belongs to the object it was written about.
      this.rejectReason = "";
      this.showRawSource = false;
      this.showThumbnail = false;
      this.showFileDetails = false;
      this.rawSource = "";
      this.rawSourceError = "";
      // Invalidates any in-flight source request for the object being left:
      // `openRawSource`'s guard compares `rawSourceFor` against the id it
      // requested for, so leaving it pointed at the old object would let that
      // object's response land in `rawSource` after navigation, silently
      // showing stale source under the new object's id.
      this.rawSourceFor = null;
      // Cleared here rather than in loadInspection(), which is also called to
      // refresh the *same* object after Edit Name / Update Limit -- clearing
      // there would flash "Loading..." on every edit. Navigating to a
      // different object must drop the previous one immediately, before the
      // new request is even sent, so its Accept/Reject/Edit controls cannot
      // be clicked while they still belong to the object no longer on screen.
      this.inspection = null;
      this.loadInspection();
    },
  },
  async mounted(): Promise<void> {
    if (!(await this.confirmMallStaff())) {
      return;
    }
    await this.loadInspection();
    await this.loadQueue();
  },
  methods: {
    async confirmMallStaff(): Promise<boolean> {
      try {
        await this.$http.get("/mall/can_admin");
        return true;
      } catch (error) {
        this.accessDenied = true;
        return false;
      }
    },

    async loadInspection(): Promise<void> {
      this.loadError = "";
      if (!Number.isFinite(this.objectId)) {
        this.loadError = "That is not a valid object id.";
        return;
      }
      const requestedFor = this.objectId;
      this.inspectionFor = requestedFor;
      try {
        const response = await this.$http.get(`/mall/object/${requestedFor}/inspection`);
        if (this.inspectionFor !== requestedFor) {
          return; // staff have already moved to another object
        }
        this.inspection = response.data.inspection;
        // Swapped only now, so the viewer keeps showing the previous object
        // until the next one is genuinely ready to be displayed.
        const assets = this.inspection && this.inspection.object && this.inspection.object.assets;
        this.viewerUrl = (assets && assets.wrl && assets.wrl.url) || "";
      } catch (errorResponse: any) {
        if (this.inspectionFor !== requestedFor) {
          return;
        }
        const status = errorResponse.response && errorResponse.response.status;
        this.loadError = status === 404
          ? "That object no longer exists."
          : "The object could not be loaded.";
        // Nothing loaded, so the previous object's model must not sit under an
        // error message as though it were this one.
        this.viewerUrl = "";
      }
    },

    /**
     * Captures the ordered ids of the list the checker came from, so queue
     * navigation is by id rather than by a position that shifts underneath us
     * the moment an object is accepted or rejected.
     */
    async loadQueue(): Promise<void> {
      const status = LIST_STATUS[this.from];
      if (status === undefined) {
        return;
      }

      // Resolved against the originating list's OWN defaults. A canonical URL
      // omits them, and Stocked's default sort is DESC while the others are
      // ASC -- assuming ASC here would walk the queue in a different order from
      // the list the checker was opened from.
      const state = readListState(this.$route.query, listDefaults(this.from));
      const offset = (state.page - 1) * state.limit;

      this.queue.limit = state.limit;
      this.queue.offset = offset;
      this.queue.order = state.order;
      const loaded = await this.fetchQueuePage(status, offset, state.limit);
      this.queue.ids = loaded.ids;
      this.queue.total = loaded.total;
    },

    async fetchQueuePage(status: number, offset: number, limit: number): Promise<any> {
      try {
        const response = await this.$http.get("/mall/all_objects", {
          column: "status",
          compare: "=",
          content: status,
          limit,
          offset: Math.max(offset, 0),
          orderBy: this.queue.order,
        });
        return {
          ids: response.data.objects.objects.map((entry: any) => entry.id),
          total: response.data.objects.total[0].count,
        };
      } catch (error) {
        return { ids: [], total: 0 };
      }
    },

    /** The nearest id in the captured order that has not been acted on yet. */
    neighbour(step: number): number {
      if (this.currentIndex < 0) {
        return null;
      }
      let index = this.currentIndex + step;
      while (index >= 0 && index < this.queue.ids.length) {
        const candidate = this.queue.ids[index];
        if (this.queue.consumed.indexOf(candidate) === -1) {
          return candidate;
        }
        index += step;
      }
      return null;
    },

    async goTo(objectId: number): Promise<void> {
      if (!objectId) {
        return;
      }
      await this.$router.push({
        name: "mall-checker",
        params: { object_id: String(objectId) },
        query: this.$route.query,
      }).catch(() => undefined);
    },

    /**
     * Extends the captured queue by one page when the checker runs off either
     * end, so the queue is continuous across the list's pagination.
     */
    async extendQueue(direction: number): Promise<boolean> {
      const status = LIST_STATUS[this.from];
      if (status === undefined) {
        return false;
      }
      if (direction < 0 && (this.queue.offset === 0 || this.queue.exhaustedBefore)) {
        return false;
      }
      if (direction > 0 && this.queue.exhaustedAfter) {
        return false;
      }

      // Every consumed object has left the status list this queue pages through
      // (only Accept and Reject mark one consumed, and both change its status),
      // so the server's result set has shifted left by that many rows. Paging
      // forward by the captured length would step past exactly that many
      // objects: capture [1..10], reject 10, and a raw offset of 10 lands on the
      // twelfth object, silently skipping 11.
      //
      // Backward extension needs no such adjustment: removing a row shifts only
      // the rows after it, and everything consumed sits at or after this.offset.
      const consumedInQueue = this.queue.ids
        .filter((id: number) => this.queue.consumed.indexOf(id) !== -1).length;

      const offset = direction < 0
        ? Math.max(this.queue.offset - this.queue.limit, 0)
        : Math.max(this.queue.offset + this.queue.ids.length - consumedInQueue, 0);
      const page = await this.fetchQueuePage(status, offset, this.queue.limit);

      if (!page.ids.length) {
        if (direction < 0) {
          this.queue.exhaustedBefore = true;
        } else {
          this.queue.exhaustedAfter = true;
        }
        return false;
      }

      // Another staff member acting on the same list concurrently can shift the
      // result set further than our own consumption accounts for, which would
      // hand back a row already captured. Duplicate ids would break navigation,
      // which is indexOf-based, so they are dropped rather than appended.
      const known = this.queue.ids;
      const fresh = page.ids.filter((id: number) => known.indexOf(id) === -1);

      if (!fresh.length) {
        if (direction < 0) {
          this.queue.exhaustedBefore = true;
        } else {
          this.queue.exhaustedAfter = true;
        }
        return false;
      }

      if (direction < 0) {
        this.queue.ids = fresh.concat(this.queue.ids);
        this.queue.offset = offset;
      } else {
        this.queue.ids = this.queue.ids.concat(fresh);
      }
      this.queue.total = page.total;
      return true;
    },

    openThumbnail(): void {
      this.showThumbnail = true;
    },

    openFileDetails(): void {
      this.showFileDetails = true;
    },

    /**
     * Opens the source viewer, fetching the decoded file the first time.
     *
     * The dialog is opened before the fetch resolves so it can show its own
     * loading state, rather than leaving the button apparently dead while a
     * large gzip-backed object is read and decompressed server-side.
     */
    async openRawSource(): Promise<void> {
      this.showRawSource = true;
      if (this.rawSource) {
        return;
      }
      this.rawSourceError = "";
      const requestedFor = this.objectId;
      this.rawSourceFor = requestedFor;
      try {
        const response = await this.$http.get(`/mall/object/${requestedFor}/source`);
        if (this.rawSourceFor !== requestedFor) {
          return;
        }
        this.rawSource = response.data;
      } catch (error) {
        if (this.rawSourceFor !== requestedFor) {
          return;
        }
        // Shown, but deliberately not stored in `rawSource`: caching the failure
        // there makes the `this.rawSource` short-circuit above treat it as a
        // successful fetch, so a transient error would never be retried.
        this.rawSourceError = "The source of this object could not be decoded.";
      }
    },

    /**
     * Saves the decompressed source through the authenticated client.
     *
     * `/mall/object/:id/source` is behind `requireMallStaff`, which authorises
     * from the `apitoken` request header alone. A plain `<a href>` is a browser
     * navigation and cannot carry that header, so linking straight at the
     * endpoint returns 400 even for a signed-in staff member; the bytes have to
     * come back through the api client and be saved from memory instead.
     */
    async downloadSource(): Promise<void> {
      if (this.isDownloading) {
        return;
      }
      this.isDownloading = true;
      this.rawSourceError = "";
      const requestedFor = this.objectId;
      let url = "";
      try {
        const response = await this.$http.get(`/mall/object/${requestedFor}/source`);
        const blob = new Blob([response.data], { type: "model/vrml" });
        url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        // Matches the name the server sends for `?download=1`: never the
        // member-supplied object name, never the stored filename.
        link.download = `object-${requestedFor}.wrl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        this.rawSourceError = "The source of this object could not be downloaded.";
      } finally {
        if (url) {
          // Deferred a tick: some browsers fetch the blob url after the current
          // task ends, and revoking synchronously cancels the download.
          const pending = url;
          window.setTimeout(() => window.URL.revokeObjectURL(pending), 0);
        }
        this.isDownloading = false;
      }
    },

    confirmApprove(): void {
      if (!window.confirm(`Accept "${this.object.name}" (#${this.object.id})?`)) {
        return;
      }
      this.approveObject();
    },

    /**
     * Acceptance has the same three outcomes rejection does, and they must not
     * be conflated. `alreadyAccepted` means a concurrent request already won
     * the row-lock race and performed the real transition -- this request moved
     * nothing and notified no one, so it must not ask staff to follow up on a
     * notification that was never attempted. A genuine notification failure is
     * still a completed acceptance and warns rather than inviting a second
     * Accept.
     */
    async approveObject(): Promise<void> {
      // Captured before the request, because a success advances the queue and
      // `this.object` is then the next object rather than the accepted one.
      const acceptedName = objectDisplayName(this.object);

      const data = await this.performAction(
        "/mall/approve",
        { objectId: this.object.id },
        "Object accepted and the uploader notified.",
      );

      if (this.actionError) {
        return;
      }

      // Set after the queue has advanced, so navigation does not clear it.
      if (data && data.alreadyAccepted) {
        this.actionSuccess = "Object was already accepted.";
      } else if (data && data.notified === false) {
        this.actionSuccess = "Object accepted.";
        this.actionWarning = `${acceptedName} was accepted, but the uploader `
          + "could not be notified. Follow up manually.";
      }
    },

    confirmReject(): void {
      const reason = this.rejectReason.trim();
      const invalid = rejectReasonError(reason);
      if (invalid) {
        this.actionError = invalid;
        this.actionSuccess = "";
        this.actionWarning = "";
        return;
      }
      if (!window.confirm(
        `Reject "${this.object.name}" (#${this.object.id})?\n\n` +
        `The uploader will be sent this reason:\n\n${reason}`,
      )) {
        return;
      }
      this.rejectObject(reason);
    },

    /**
     * Rejection has four outcomes, and they must not be conflated.
     *
     * A failure leaves the reason typed and the object in place so it can be
     * retried. `alreadyRejected` means a concurrent request already won the
     * row-lock race and completed the rejection -- this request did nothing,
     * so it must not claim to have notified anyone or ask staff to follow up
     * on a notification that was never attempted. A genuine notification
     * failure is still a completed rejection -- the refund has already
     * happened -- so it advances like any other success and warns rather than
     * inviting a second Reject.
     */
    async rejectObject(reason: string): Promise<void> {
      // Captured before the request, because a success advances the queue and
      // `this.object` is then the next object rather than the rejected one.
      const rejectedName = objectDisplayName(this.object);

      const data = await this.performAction(
        "/mall/reject",
        { id: this.object.id, reason },
        "Object rejected and the uploader notified.",
      );

      if (this.actionError) {
        return;
      }

      this.rejectReason = "";
      // Set after the queue has advanced, so navigation does not clear it.
      if (data && data.alreadyRejected) {
        this.actionSuccess = "Object was already rejected.";
      } else if (data && data.notified === false) {
        this.actionSuccess = "Object rejected.";
        this.actionWarning = `${rejectedName} was rejected, but the uploader `
          + "could not be notified. Follow up manually.";
      }
    },

    /** Returns the response body so a caller can act on what the server reported. */
    async performAction(endpoint: string, body: any, success: string): Promise<any> {
      if (this.isProcessing) {
        return null;
      }
      this.isProcessing = true;
      this.actionError = "";
      this.actionSuccess = "";
      this.actionWarning = "";
      let data: any = null;
      try {
        const response: any = await this.$http.post(endpoint, body);
        data = response && response.data;
        this.actionSuccess = success;
        await this.advancePastCurrent();
      } catch (errorResponse: any) {
        const errorData = errorResponse.response && errorResponse.response.data;
        this.actionError = (errorData && errorData.error) || "An unknown error occurred";
      } finally {
        this.isProcessing = false;
      }
      return data;
    },

    /**
     * Marks the object just acted on as consumed and moves to the next id in the
     * captured queue. Deliberately not a re-query and re-index: the underlying
     * result set shifts the moment an object leaves the list, so an index-based
     * step would silently skip the neighbour.
     */
    async advancePastCurrent(): Promise<void> {
      if (this.queue.consumed.indexOf(this.objectId) === -1) {
        this.queue.consumed.push(this.objectId);
      }

      let target = this.nextId;
      if (!target && await this.extendQueue(1)) {
        target = this.nextId;
      }
      if (!target) {
        target = this.previousId;
      }

      if (target) {
        await this.goTo(target);
      } else {
        this.backToList();
      }
    },

    async updateName(): Promise<void> {
      const current = this.object.name;
      const updated = window.prompt(`Current Name:\n ${current}\n\nNew Name:`, current);
      if (updated === null || updated === "") {
        return;
      }
      await this.performStaffEdit(
        "/mall/updateObjectName",
        { objectId: this.object.id, name: updated },
        "Object name updated.",
      );
    },

    async updateLimit(): Promise<void> {
      const entered = window.prompt(
        "Update limit to this object\n NOTE: Setting the limit to 0 makes it Unlimited\n",
      );
      if (entered === null || entered === "") {
        return;
      }
      const digits = entered.replace(/[^0-9]/g, "");
      if (digits !== entered) {
        this.actionError = "Use whole numbers only!";
        return;
      }
      if (digits !== "0" && Number.parseInt(digits, 10) < this.object.quantity) {
        this.actionError = "Limit cannot be less than the uploaded quantity.";
        return;
      }
      await this.performStaffEdit(
        "/mall/limit",
        { objectId: this.object.id, limit: digits },
        "Object limit updated.",
      );
    },

    /**
     * The buttons already bind `:disabled="isProcessing"`, but nothing here ever
     * set it -- so an edit left them live and a second click sent a second
     * mutation against the same object while the first was still in flight.
     */
    async performStaffEdit(endpoint: string, body: any, success: string): Promise<void> {
      if (this.isProcessing) {
        return;
      }
      this.isProcessing = true;
      this.actionError = "";
      this.actionSuccess = "";
      this.actionWarning = "";
      try {
        await this.$http.post(endpoint, body);
        this.actionSuccess = success;
        await this.loadInspection();
      } catch (errorResponse: any) {
        const data = errorResponse.response && errorResponse.response.data;
        this.actionError = (data && data.error) || "An unknown error occurred";
      } finally {
        this.isProcessing = false;
      }
    },

    /**
     * Returns to the list the checker was opened from, carrying back every
     * parameter that list uses - page and sort for the status lists, the search
     * term for Search - so a review never costs the checker their place.
     */
    backToList(): void {
      if (!LIST_LABELS[this.from]) {
        this.$router.push({ path: "/mall/pending" }).catch(() => undefined);
        return;
      }
      const query: any = {};
      Object.keys(this.$route.query).forEach(key => {
        if (key !== "from") {
          query[key] = this.$route.query[key];
        }
      });
      this.$router.push({ path: `/mall/${this.from}`, query }).catch(() => undefined);
    },

    displayValue(value: any): string {
      if (value === null || value === undefined || value === "") {
        return "-";
      }
      return String(value);
    },

    verdictClass(verdict: string): string {
      if (verdict === "MATCH") {
        return "text-green";
      }
      if (verdict === "MISMATCH") {
        return "text-red-500";
      }
      return "opacity-60";
    },

    formatBytes(bytes: number): string {
      if (bytes === null || bytes === undefined) {
        return "-";
      }
      return `${bytes.toLocaleString()} bytes`;
    },

    formatDate(value: string): string {
      if (!value) {
        return "unknown";
      }
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
  },
});
</script>

<style scoped>
/*
 * The checker renders inside the site's normal content region, so every rule
 * here is about staying inside it. Nothing uses a fixed pixel width: the owner's
 * desktop is not the only screen this is used on, and a tablet in portrait must
 * not push the historical right-hand control panel off the page.
 */
.ctr-checker {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.ctr-checker-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ffffff;
  min-width: 0;
}

.ctr-checker-identity {
  flex: 1 1 20rem;
  min-width: 0;
}

/* The one thing a checker must read first. */
.ctr-checker-name {
  font-size: 1.6rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
  min-width: 0;
}

/* Identity and state, secondary to the name. */
.ctr-checker-subline {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.15rem;
  min-width: 0;
}

.ctr-checker-id {
  opacity: 0.6;
}

.ctr-status-badge {
  font-size: 0.75rem;
  border: 1px solid currentColor;
  padding: 0 0.5rem;
  white-space: nowrap;
}

.ctr-review-state {
  font-size: 0.85rem;
  color: #9fd8ff;
}

.ctr-checker-guidance {
  font-size: 0.8rem;
  opacity: 0.75;
  margin-top: 0.25rem;
  max-width: 46rem;
}

/* Labelled pairs rather than a run of middots: a novice checker should not have
   to work out which number is the price and which is the quantity. */
.ctr-checker-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 1rem;
  margin-top: 0.25rem;
  font-size: 0.8rem;
}

.ctr-checker-facts > div {
  display: flex;
  gap: 0.35rem;
  min-width: 0;
}

.ctr-checker-facts dt {
  opacity: 0.6;
}

.ctr-checker-facts dd {
  overflow-wrap: anywhere;
}

/* A distinct block, so "where am I / how do I move" never reads as part of the
   object's own identity. */
.ctr-checker-queue {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
  padding-left: 0.75rem;
}

.ctr-queue-step {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

.ctr-queue-count {
  white-space: nowrap;
  font-size: 0.85rem;
  opacity: 0.85;
}

/* Comfortable to hit with a thumb, not just a mouse pointer. Scoped under the
   nav so it outranks the global `.btn-ui-inline`, which is sized for dense
   inline use and is only 29px tall on its own. */
.ctr-checker-queue .ctr-queue-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Explicit px, not rem: this app sets a 13px root, so a rem-based target
     silently comes out ~29px -- under any reasonable touch minimum. */
  min-height: 40px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.ctr-queue-secondary {
  font-size: 0.75rem;
  opacity: 0.7;
  text-decoration: underline;
}

/* Below tablet-landscape the queue block sits under the identity rather than
   squeezing it into a column too narrow to read. */
@media (max-width: 900px) {
  .ctr-checker-queue {
    align-items: flex-start;
    border-left: 0;
    padding-left: 0;
    width: 100%;
  }

  .ctr-queue-step {
    justify-content: flex-start;
  }
}

.ctr-checker-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.ctr-pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ctr-pane-technical {
  padding: 0.5rem;
}

.ctr-preview {
  flex: 1 1 auto;
  min-height: 20rem;
}

.ctr-findings {
  border-top: 1px solid #ffffff;
  padding: 0.5rem;
}

.ctr-section {
  margin-bottom: 1rem;
  min-width: 0;
}

.ctr-section-head {
  border-bottom: 1px solid #ffffff;
  margin-bottom: 0.25rem;
}

/* Plain language first, exact fact second. Both are kept: simplifying by
   deleting the technical value would make the page useless to the people who
   can actually read VRML. */
.ctr-plain {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.35rem;
}

.ctr-note {
  font-size: 0.75rem;
  opacity: 0.6;
}

.ctr-finding-group {
  font-size: 0.85rem;
  font-weight: bold;
}

.ctr-finding-list {
  list-style: disc;
  margin-left: 1.25rem;
}

.ctr-finding-list > li {
  margin-bottom: 0.5rem;
}

.ctr-finding-message {
  overflow-wrap: anywhere;
}

.ctr-finding-code {
  font-size: 0.75rem;
  opacity: 0.6;
  overflow-wrap: anywhere;
}

.ctr-thumb-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.ctr-thumb-button {
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0;
  line-height: 0;
  cursor: pointer;
  background: none;
}

.ctr-thumb-button img {
  display: block;
  max-width: 12rem;
  max-height: 12rem;
  width: auto;
  height: auto;
}

/* Wide tables scroll inside their own box. Without this a long external
   reference or a hash widens the whole document. */
.ctr-table-scroll {
  overflow-x: auto;
  max-width: 100%;
}

.ctr-table {
  width: 100%;
  border-collapse: collapse;
}

.ctr-table th {
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-right: 0.5rem;
}

.ctr-table td {
  vertical-align: top;
  padding-right: 0.5rem;
  overflow-wrap: anywhere;
}

.ctr-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.ctr-moderation {
  border-top: 3px solid #ef4444;
  padding-top: 0.5rem;
}

.ctr-moderation-head {
  border-bottom-color: #ef4444;
}

/*
 * Accept and Reject take the same shape as Edit Name and Update Limit -- they
 * belong to the same row of staff controls -- and carry the only colour in it.
 * These two are the irreversible ones, so they are the two a checker should be
 * able to tell apart without reading, while everything around them stays the
 * site's ordinary button language.
 */
.ctr-actions .ctr-accept,
.ctr-actions .ctr-reject {
  color: #ffffff !important;
  font-weight: bold;
}

.ctr-actions .ctr-accept {
  background-color: #1d6b33;
  border-color: #2f9c4c;
}

.ctr-actions .ctr-reject {
  background-color: #8a2226;
  border-color: #c04a4e;
}

.ctr-actions .ctr-accept:hover:not(:disabled) {
  background-color: #248140;
}

.ctr-actions .ctr-reject:hover:not(:disabled) {
  background-color: #a62b30;
}

/* Disabled while a moderation request is in flight; it must not still read as
   an armed control. */
.ctr-actions .ctr-accept:disabled,
.ctr-actions .ctr-reject:disabled {
  opacity: 0.5;
}

.ctr-field-label {
  display: block;
  text-transform: uppercase;
  font-size: 0.75rem;
  opacity: 0.6;
}

/* A few lines, not the width of the page. The 2000-character server limit is
   unchanged -- this bounds how much is shown at once, never how much can be
   written. */
.ctr-reason {
  display: block;
  width: 100%;
  max-width: 40rem;
  padding: 0.25rem;
  margin-top: 0.25rem;
  background: #001829;
  resize: vertical;
}

.ctr-lightbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctr-lightbox img {
  max-width: 100%;
  max-height: 78vh;
  width: auto;
  height: auto;
}

.ctr-wrap-toggle {
  font-size: 0.75rem;
  margin-right: 0.5rem;
  white-space: nowrap;
}

/*
 * Default is horizontal scroll INSIDE this box, not wrapping: a VRML line is a
 * meaningful unit and re-flowing it by default would misrepresent the file.
 * `Wrap lines` opts into a soft-wrapped view of the same bytes.
 */
.ctr-source {
  font-size: 0.75rem;
  white-space: pre;
  overflow-x: auto;
  max-width: 100%;
  margin: 0;
}

.ctr-source-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-x: hidden;
}

.ctr-hash {
  overflow-wrap: anywhere;
  font-size: 0.75rem;
}

/* Two columns only when there is genuinely room for them. Below this the panes
   stack, which is what keeps 768px portrait usable. */
@media (min-width: 1024px) {
  .ctr-checker-body {
    flex-direction: row;
  }

  .ctr-pane-primary {
    width: 50%;
    border-right: 1px solid #ffffff;
  }

  .ctr-pane-technical {
    width: 50%;
    overflow-y: auto;
  }
}
</style>
