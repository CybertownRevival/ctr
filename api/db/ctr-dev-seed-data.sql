# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.35)
# Database: cybertown
# Generation Time: 2022-02-07 7:10:03 pm +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table avatar
# ------------------------------------------------------------

LOCK TABLES `avatar` WRITE;
/*!40000 ALTER TABLE `avatar` DISABLE KEYS */;

INSERT INTO `avatar` (`id`, `name`, `status`, `gestures`, `filename`, `added_ts`, `member_id`, `private`)
VALUES
	(1,'default',1,'[\"Hallo\",\"Hey\",\"Agree\",\"Like\",\"Dislike\",\"Disagree\",\"Not now\",\"Good bye\",\"Appear\",\"Disappear\"]','default.wrl','2021-12-01 18:32:55',0,0),
	(2,'Tonaki\'s m1',1,'[\"Bonjour01\",\"Rire jim\",\"Frowns jim\",\"Agrees jim\",\"Smiles jim\",\"Disagrees jim\",\"Non jim\",\"Rejet jim\",\"Good by jim\",\"Superzen lil\",\"Pose homme\",\"Marche\"]','m1.wrl','2021-12-01 18:33:24',0,0);

/*!40000 ALTER TABLE `avatar` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table place
# ------------------------------------------------------------

LOCK TABLES `place` WRITE;
/*!40000 ALTER TABLE `place` DISABLE KEYS */;

INSERT INTO `place` (`id`, `name`, `description`, `slug`, `assets_dir`, `status`, `world_filename`)
VALUES
	(1,'Test Place','this is a description','test',NULL,0,NULL),
	(2,'The Meh Place',NULL,'meh',NULL,0,NULL),
	(3,'The Plaza','Welcome to the plaza','enter','/enter/vrml/',1,'enter.wrl'),
	(4,'Home 0','Welcome to home 0','home00','/000/',1,'home.wrl'),
	(5,'Gameshow','Welcome to gameshow','gameshow','/gameshow/',1,'vrml/gameshow.wrl'),
	(6,'fleamarket','fleamaket','fleamarket','/fleamarket/',1,'vrml/fleamarket.wrl'),
	(7,'beach','beach','beach','/beach/',1,'vrml/beach.wrl'),
	(8,'blackmarket','blackmarket','blackmarket','/blackmarket/',1,'vrml/blackmarket.wrl'),
	(9,'mall','mall','mall','/shopping/',1,'vrml/shopping.wrl'),
	(10,'bank','bank','bank','/bank/',1,'vrml/bank.wrl'),
	(11,'employment','employment','employment','/employment/',1,'vrml/employment.wrl'),
	(12,'outlands','outlands','outlands','/ne_game/',1,'vrml/ne_game.wrl'),
	(13,'cafe','cafe','cafe','/cafe/',1,'vrml/cafe.wrl'),
	(14,'library','library','library','/library/',1,'vrml/library.wrl'),
	(15,'jail','jail','jail','/jail/',1,'vrml/jail.wrl'),
	(16,'funpark','funpark','funpark','/funpark/',1,'vrml/funpark.wrl'),
	(17,'waterpark','waterpark','waterpark','/waterpark/',1,'vrml/waterpark.wrl'),
	(18,'themepark','themepark','themepark','/themepark/',1,'vrml/themepark.wrl'),
	(19,'cityhall','cityhall','cityhall','/cityhall/',1,'vrml/cityhall.wrl'),
	(20,'Performing Arts','Performing Arts','theatre','/theatre/',1,'vrml/theatre.wrl'),
	(21,'The Pool','The Pool','pool','/pool/',1,'vrml/pool.wrl'),
	(22,'The Stadium','The Stadium','stadium','/stadium/',1,'vrml/stadium.wrl'),
	(23,'Post Office','Post Office','postoffice','/post/',1,'vrml/post.wrl');

/*!40000 ALTER TABLE `place` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
