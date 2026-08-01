CREATE DATABASE  IF NOT EXISTS `db_bomberos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_bomberos`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: db_bomberos
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_bitacora`),
  KEY `fk_bitacora_usuario` (`id_usuario`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
INSERT INTO `bitacora` VALUES (1,'Inicialización del sistema con datos geográficos actualizados.','2026-06-20','11:45:51',1);
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bombero`
--

DROP TABLE IF EXISTS `bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bombero` (
  `id_bombero` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_celular` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_bombero`),
  UNIQUE KEY `uq_bombero_usuario` (`id_usuario`),
  CONSTRAINT `fk_bombero_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bombero`
--

LOCK TABLES `bombero` WRITE;
/*!40000 ALTER TABLE `bombero` DISABLE KEYS */;
/*!40000 ALTER TABLE `bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamento`
--

DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_departamento_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento`
--

LOCK TABLES `departamento` WRITE;
/*!40000 ALTER TABLE `departamento` DISABLE KEYS */;
INSERT INTO `departamento` VALUES (2,'Quetzaltenango'),(3,'Retalhuleu'),(1,'San Marcos');
/*!40000 ALTER TABLE `departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_bombero`
--

DROP TABLE IF EXISTS `detalle_bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_bombero` (
  `id_detalle_bombero` int NOT NULL AUTO_INCREMENT,
  `id_bombero` int NOT NULL,
  `id_emergencia` int NOT NULL,
  PRIMARY KEY (`id_detalle_bombero`),
  UNIQUE KEY `uq_db_bom_emg` (`id_bombero`,`id_emergencia`),
  KEY `fk_db_emergencia` (`id_emergencia`),
  CONSTRAINT `fk_db_bombero` FOREIGN KEY (`id_bombero`) REFERENCES `bombero` (`id_bombero`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_db_emergencia` FOREIGN KEY (`id_emergencia`) REFERENCES `emergencia` (`id_emergencia`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=273 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_bombero`
--

LOCK TABLES `detalle_bombero` WRITE;
/*!40000 ALTER TABLE `detalle_bombero` DISABLE KEYS */;
INSERT INTO `detalle_bombero` VALUES (262,1,66),(265,1,67),(268,1,68),(7,3,3),(2,3,5),(9,3,7),(11,3,9),(19,3,13),(90,3,28),(113,3,30),(116,3,31),(126,3,32),(127,3,33),(142,3,37),(170,3,41),(173,3,42),(191,3,43),(206,3,44),(209,3,45),(210,3,46),(261,3,65),(270,3,68),(12,4,11),(20,4,13),(40,4,16),(44,4,17),(48,4,18),(55,4,20),(58,4,21),(62,4,22),(85,4,26),(87,4,27),(128,4,33),(143,4,37),(211,4,46),(214,4,47),(217,4,48),(221,4,49),(226,4,50),(229,4,51),(233,4,52),(236,4,53),(239,4,54),(242,4,55),(264,4,66),(267,4,67),(272,4,69),(21,5,13),(230,6,51),(245,6,57),(247,6,58),(249,6,59),(251,6,60),(253,6,61),(255,6,62),(257,6,63),(259,6,64),(260,6,65),(18,7,12),(33,7,14),(39,7,16),(43,7,17),(47,7,18),(51,7,19),(54,7,20),(59,7,21),(63,7,22),(75,7,24),(79,7,25),(84,7,26),(89,7,28),(92,7,29),(112,7,30),(115,7,31),(125,7,32),(130,7,34),(132,7,35),(136,7,36),(141,7,37),(147,7,38),(151,7,40),(169,7,41),(172,7,42),(190,7,43),(205,7,44),(208,7,45),(213,7,47),(216,7,48),(222,7,49),(225,7,50),(228,7,51),(232,7,52),(235,7,53),(238,7,54),(241,7,55),(263,7,66),(266,7,67),(271,7,69),(17,8,12),(32,8,14),(38,8,16),(42,8,17),(46,8,18),(50,8,19),(53,8,20),(57,8,21),(61,8,22),(269,8,68),(243,10,56),(244,10,57),(246,10,58),(248,10,59),(250,10,60),(252,10,61),(254,10,62),(256,10,63),(258,10,64);
/*!40000 ALTER TABLE `detalle_bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_insumo`
--

DROP TABLE IF EXISTS `detalle_insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_insumo` (
  `id_detalle_insumo` int NOT NULL AUTO_INCREMENT,
  `cantidad_utilizada` int NOT NULL,
  `id_insumo` int NOT NULL,
  `id_emergencia` int NOT NULL,
  PRIMARY KEY (`id_detalle_insumo`),
  UNIQUE KEY `uq_di_ins_emg` (`id_insumo`,`id_emergencia`),
  KEY `fk_di_emergencia` (`id_emergencia`),
  CONSTRAINT `fk_di_emergencia` FOREIGN KEY (`id_emergencia`) REFERENCES `emergencia` (`id_emergencia`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_di_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_cantidad_usada` CHECK ((`cantidad_utilizada` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_insumo`
--

LOCK TABLES `detalle_insumo` WRITE;
/*!40000 ALTER TABLE `detalle_insumo` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_insumo` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_descontar_stock` AFTER INSERT ON `detalle_insumo` FOR EACH ROW BEGIN
    UPDATE Insumo
       SET cantidad_stock = cantidad_stock - NEW.cantidad_utilizada
     WHERE id_insumo = NEW.id_insumo;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `detalle_vehiculo`
--

DROP TABLE IF EXISTS `detalle_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_vehiculo` (
  `id_detalle_vehiculo` int NOT NULL AUTO_INCREMENT,
  `id_vehiculo` int NOT NULL,
  `id_emergencia` int NOT NULL,
  PRIMARY KEY (`id_detalle_vehiculo`),
  UNIQUE KEY `uq_dv_veh_emg` (`id_vehiculo`,`id_emergencia`),
  KEY `fk_dv_emergencia` (`id_emergencia`),
  CONSTRAINT `fk_dv_emergencia` FOREIGN KEY (`id_emergencia`) REFERENCES `emergencia` (`id_emergencia`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_dv_vehiculo` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculo` (`id_vehiculo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_vehiculo`
--

LOCK TABLES `detalle_vehiculo` WRITE;
/*!40000 ALTER TABLE `detalle_vehiculo` DISABLE KEYS */;
INSERT INTO `detalle_vehiculo` VALUES (9,1,3),(5,1,5),(10,1,7),(11,1,8),(15,1,12),(16,1,13),(23,1,16),(24,1,17),(25,1,18),(26,1,19),(27,1,20),(28,1,21),(29,1,22),(30,1,23),(38,1,24),(40,1,25),(42,1,26),(43,1,27),(45,1,29),(52,1,30),(53,1,31),(60,1,32),(61,1,33),(62,1,34),(63,1,35),(65,1,36),(69,1,37),(72,1,38),(75,1,40),(92,1,43),(98,1,44),(99,1,45),(101,1,47),(102,1,48),(106,1,49),(108,1,50),(110,1,51),(113,1,53),(114,1,54),(115,1,55),(116,1,56),(117,1,57),(119,1,59),(120,1,60),(121,1,61),(122,1,62),(123,1,63),(126,1,65),(127,1,66),(128,1,67),(129,1,68),(12,2,9),(13,2,11),(20,2,14),(44,3,28),(70,3,37),(74,3,39),(85,3,41),(86,3,42),(100,3,46),(103,3,48),(107,3,49),(109,3,50),(111,3,51),(112,3,52),(118,3,58),(124,3,63),(125,3,64),(130,3,69);
/*!40000 ALTER TABLE `detalle_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergencia`
--

DROP TABLE IF EXISTS `emergencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergencia` (
  `id_emergencia` int NOT NULL AUTO_INCREMENT,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_vivienda` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zona` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_municipio` int NOT NULL,
  `id_tipo_emergencia` int NOT NULL,
  `id_llamada` int NOT NULL,
  `fecha_hora_inicio` datetime DEFAULT NULL,
  `fecha_hora_fin` datetime DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_emergencia`),
  UNIQUE KEY `uq_emergencia_llamada` (`id_llamada`),
  KEY `fk_emergencia_mpio` (`id_municipio`),
  KEY `fk_emergencia_tipo_emg` (`id_tipo_emergencia`),
  CONSTRAINT `fk_emergencia_llamada` FOREIGN KEY (`id_llamada`) REFERENCES `llamada` (`id_llamada`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_emergencia_mpio` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_emergencia_tipo_emg` FOREIGN KEY (`id_tipo_emergencia`) REFERENCES `tipo_emergencia` (`id_tipo_emergencia`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergencia`
--

LOCK TABLES `emergencia` WRITE;
/*!40000 ALTER TABLE `emergencia` DISABLE KEYS */;
/*!40000 ALTER TABLE `emergencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estado_vehiculo`
--

DROP TABLE IF EXISTS `estado_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_vehiculo` (
  `id_estado_vehiculo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_estado_vehiculo`),
  UNIQUE KEY `uq_estado_vehiculo_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_vehiculo`
--

LOCK TABLES `estado_vehiculo` WRITE;
/*!40000 ALTER TABLE `estado_vehiculo` DISABLE KEYS */;
INSERT INTO `estado_vehiculo` VALUES (1,'Disponible','Unidad lista para despacho.'),(2,'En Servicio','Unidad atendiendo emergencia.'),(3,'En Mantenimiento','Unidad en revisión mecánica.'),(4,'Fuera de Servicio','Unidad inhabilitada.');
/*!40000 ALTER TABLE `estado_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insumo`
--

DROP TABLE IF EXISTS `insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_stock` int NOT NULL DEFAULT '0',
  `id_tipo_insumo` int NOT NULL,
  PRIMARY KEY (`id_insumo`),
  UNIQUE KEY `uq_insumo_nombre` (`nombre`),
  KEY `fk_insumo_tipo` (`id_tipo_insumo`),
  CONSTRAINT `fk_insumo_tipo` FOREIGN KEY (`id_tipo_insumo`) REFERENCES `tipo_insumo` (`id_tipo_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock_no_neg` CHECK ((`cantidad_stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insumo`
--

LOCK TABLES `insumo` WRITE;
/*!40000 ALTER TABLE `insumo` DISABLE KEYS */;
INSERT INTO `insumo` VALUES (1,'Venda elástica 4',200,1),(2,'Guantes de látex (caja)',50,1),(3,'Diesel (galones)',200,5);
/*!40000 ALTER TABLE `insumo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `llamada`
--

DROP TABLE IF EXISTS `llamada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `llamada` (
  `id_llamada` int NOT NULL AUTO_INCREMENT,
  `nombre_solicitante` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telefono` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_vivienda` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zona` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_municipio` int NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_llamada`),
  KEY `fk_llamada_mpio` (`id_municipio`),
  KEY `fk_llamada_usuario` (`id_usuario`),
  CONSTRAINT `fk_llamada_mpio` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_llamada_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `llamada`
--

LOCK TABLES `llamada` WRITE;
/*!40000 ALTER TABLE `llamada` DISABLE KEYS */;
/*!40000 ALTER TABLE `llamada` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `municipio`
--

DROP TABLE IF EXISTS `municipio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `municipio` (
  `id_municipio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_departamento` int NOT NULL,
  PRIMARY KEY (`id_municipio`),
  KEY `fk_municipio_depto` (`id_departamento`),
  CONSTRAINT `fk_municipio_depto` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `municipio`
--

LOCK TABLES `municipio` WRITE;
/*!40000 ALTER TABLE `municipio` DISABLE KEYS */;
INSERT INTO `municipio` VALUES (1,'San Rafael Pie de la Cuesta',1),(2,'San Pablo',1),(3,'El Rodeo',1),(4,'Malacatán',1),(5,'El Tumbador',1),(6,'Nuevo Progreso',1),(7,'Tajumulco',1),(8,'Sibinal',1),(9,'Esquipulas Palo Gordo',1),(10,'San Marcos (Cabecera)',1),(11,'San Pedro Sacatepéquez',1),(12,'Catarina',1),(13,'Ayutla (Tecún Umán)',1),(14,'Quetzaltenango',2),(15,'Coatepeque',2),(16,'Retalhuleu',3);
/*!40000 ALTER TABLE `municipio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_rol_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'ADMIN','Administrador con acceso total.',1),(2,'DESPACHO','Telefonista y despachador.',1),(3,'BOMBERO','Personal operativo.',1),(4,'JEFE','Jefe de estación.',1);
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_bombero`
--

DROP TABLE IF EXISTS `tb_bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_bombero` (
  `ID_BOMBERO` int NOT NULL AUTO_INCREMENT,
  `ID_PERSONA` int DEFAULT NULL,
  `ID_GRADO` int DEFAULT NULL,
  `ID_ESTADO_B` int DEFAULT NULL,
  `FECHA_INGRESO` date DEFAULT NULL,
  `TURNO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CARGO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Bombero de Línea',
  PRIMARY KEY (`ID_BOMBERO`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_bombero`
--

LOCK TABLES `tb_bombero` WRITE;
/*!40000 ALTER TABLE `tb_bombero` DISABLE KEYS */;
INSERT INTO `tb_bombero` VALUES (1,1,2,1,'2024-01-10','Voluntario fin de semana','Piloto / Conductor'),(3,3,1,1,'2026-06-25','Voluntario fin de semana','Bombero de Línea'),(4,4,3,1,'2026-05-04','Voluntario fin de semana','Bombero de Línea'),(6,6,3,2,'2026-06-30','Permanente','Jefe de Turno'),(7,7,1,1,'2026-07-03','Voluntario fin de semana','Piloto / Conductor'),(8,8,1,1,'2026-07-03','Voluntario fin de semana','Paramédico / Prehospitalario'),(9,9,3,2,'2026-07-08','Turno 1','Jefe de Turno'),(10,10,3,1,'2026-07-08','Permanente','Jefe de Compañía'),(11,11,3,1,'2026-07-08','Voluntario fin de semana','Jefe de Turno');
/*!40000 ALTER TABLE `tb_bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_estado_bombero`
--

DROP TABLE IF EXISTS `tb_estado_bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_estado_bombero` (
  `ID_ESTADO_B` int NOT NULL AUTO_INCREMENT,
  `ESTADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_ESTADO_B`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_estado_bombero`
--

LOCK TABLES `tb_estado_bombero` WRITE;
/*!40000 ALTER TABLE `tb_estado_bombero` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_estado_bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_estado_vehiculo`
--

DROP TABLE IF EXISTS `tb_estado_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_estado_vehiculo` (
  `ID_ESTADO_V` int NOT NULL AUTO_INCREMENT,
  `ESTADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_ESTADO_V`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_estado_vehiculo`
--

LOCK TABLES `tb_estado_vehiculo` WRITE;
/*!40000 ALTER TABLE `tb_estado_vehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_estado_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_grado_bombero`
--

DROP TABLE IF EXISTS `tb_grado_bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_grado_bombero` (
  `ID_GRADO` int NOT NULL AUTO_INCREMENT,
  `GRADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_GRADO`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_grado_bombero`
--

LOCK TABLES `tb_grado_bombero` WRITE;
/*!40000 ALTER TABLE `tb_grado_bombero` DISABLE KEYS */;
INSERT INTO `tb_grado_bombero` VALUES (1,'Caballero de Tercera Clase'),(2,'Caballero de Segunda Clase'),(3,'Oficial');
/*!40000 ALTER TABLE `tb_grado_bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_insumos`
--

DROP TABLE IF EXISTS `tb_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_insumos` (
  `ID_INSUMO` int NOT NULL AUTO_INCREMENT,
  `NOMBRE` varchar(150) NOT NULL,
  `DESCRIPCION` text,
  `TIPO_INSUMO` varchar(50) NOT NULL,
  `MARCA` varchar(100) DEFAULT NULL,
  `MODELO` varchar(100) DEFAULT NULL,
  `NUMERO_SERIE` varchar(50) DEFAULT NULL,
  `PROPOSITO` varchar(150) DEFAULT NULL,
  `STOCK` int NOT NULL DEFAULT '0',
  `ESTADO` varchar(50) NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`ID_INSUMO`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_insumos`
--

LOCK TABLES `tb_insumos` WRITE;
/*!40000 ALTER TABLE `tb_insumos` DISABLE KEYS */;
INSERT INTO `tb_insumos` VALUES (1,'Venda elástica','vendas para heridas','Insumo Médico',NULL,NULL,NULL,'Inmovilización/Compresión',9,'Activo'),(3,'Casco de rescate','ya se encuentra en desgaste','EPP','EPI','CA-G-D33','2605-7845A','Protección craneal',5,'En Reparación'),(4,'Pala','Se encuentra dañado ya no es utilizable','Herramienta','Truper','PU-27','7409-2026-00452','Remoción de escombros',1,'De Baja'),(5,'Motosierra','motosierra recien compradas','Herramienta','Husqvarna','MS 250','518473920','Corte de madera / Árboles',15,'Activo');
/*!40000 ALTER TABLE `tb_insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_personas`
--

DROP TABLE IF EXISTS `tb_personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_personas` (
  `ID_PERSONA` int NOT NULL AUTO_INCREMENT,
  `ID_USUARIO` int DEFAULT NULL,
  `NOMBRE` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `APELLIDO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DPI` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FECHA_NACIMIENTO` date DEFAULT NULL,
  `TELEFONO` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DIRECCION` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CORREO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_PERSONA`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_personas`
--

LOCK TABLES `tb_personas` WRITE;
/*!40000 ALTER TABLE `tb_personas` DISABLE KEYS */;
INSERT INTO `tb_personas` VALUES (1,NULL,'Juan','Pérez','1234567890101','1990-05-15','55551234','Ciudad','juan@gmail.com'),(2,NULL,'Alexis','Sandoval',NULL,NULL,'47975596',NULL,NULL),(3,NULL,'Ronay','Ríos','3121123131561',NULL,'45871245',NULL,'ronay@gmial.com'),(4,NULL,'Jonathan','Sandoval','6578986554212',NULL,'56897821',NULL,'jonathan@gmail.com'),(5,NULL,'Alexis Ronay','Sandoval Ríos','4521789856231',NULL,'47975596',NULL,'sandovalrioss19@gmail.com'),(6,NULL,'Meylin Johayra','Sandoval Rios','6578451521456',NULL,'87457889',NULL,'meylinsando@gmail.com'),(7,NULL,'Fernando Alejandro','Ramos De León','8754124598554',NULL,'65987854',NULL,'fernando@gmail.com'),(8,NULL,'Pedro Esteban','Pérez Guzman','5487791231561',NULL,'45879865',NULL,'pedro@gmail.com'),(9,NULL,'Alexis Ronay','Sandoval Ríos','1232356464654',NULL,'45454548',NULL,'sandovalrioss19@gmail.com'),(10,NULL,'Javier Fernandez','Hernández López','1231654646545',NULL,'45784515',NULL,'javierhernandez@gmail.com'),(11,NULL,'Pedro Juan','Castillo De León','2312313202312',NULL,'45451203',NULL,'pedrocastillo@gmail.com'),(12,5,'Alexis Ronay','Sandoval Ríos','1254561561564',NULL,NULL,NULL,NULL),(14,1,'Administrador','del Sistema','0000000000000',NULL,NULL,NULL,NULL),(17,38,'Jonathan Isaias','Sandoval Ríos','4502165160101',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tb_personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_servicios`
--

DROP TABLE IF EXISTS `tb_servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_servicios` (
  `ID_SERVICIO` int NOT NULL AUTO_INCREMENT,
  `ID_TIPO_SERVICIO` int DEFAULT NULL,
  `DESCRIPCION` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FECHA_SERVICIO` date DEFAULT NULL,
  `ESTADO` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En Curso',
  `DIRECCION_SERVICIO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ID_SOLICITANTE` int DEFAULT NULL,
  `NOMBRE_SOLICITANTE` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TELEFONO_SOLICITANTE` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HORA_SALIDA` datetime DEFAULT NULL,
  `HORA_ENTRADA` datetime DEFAULT NULL,
  `NOMBRE_PACIENTE` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del paciente atendido',
  `EDAD_PACIENTE` int DEFAULT NULL COMMENT 'Edad del paciente',
  `FALLECIDO` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT 'NO' COMMENT 'Indica SI o NO',
  `ACOMPANANTE` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del familiar o acompañante',
  `LUGAR_TRASLADO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hospital o centro asistencial',
  `UNIDAD_DESTACADA` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unidad que cubrió la emergencia (Ej. B-101)',
  `PILOTO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bombero que condujo la unidad',
  `PERSONAL_DESTACADO` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Resto del personal que atendió',
  `OBSERVACIONES_FINALES` text COLLATE utf8mb4_unicode_ci COMMENT 'Detalles clínicos o del incidente',
  PRIMARY KEY (`ID_SERVICIO`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_servicios`
--

LOCK TABLES `tb_servicios` WRITE;
/*!40000 ALTER TABLE `tb_servicios` DISABLE KEYS */;
INSERT INTO `tb_servicios` VALUES (47,5,'Persona se electrocuto en su casa','2026-07-07','En Curso','4ta Calle 3ra Avenida Zona 3 San Rafael Pie de la cuesta, San Marcos',NULL,'Jonathan Sandoval','56465445','2026-07-07 16:42:18','2026-07-07 16:42:28','Meylin Sandoval',45,'NO','Carla Sandoval','IGSS San Rafael P.C','AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','Se dio atencion medica y fue traladada al IGSS S.R'),(48,2,'Choque de dos motos deja 4 heridos','2026-07-07','En Curso','Centro San Rafael Pie de la cuesta, frente de Santa Clara Panaderia',NULL,'Meylin Sandoval','45346544','2026-07-07 16:47:11','2026-07-07 16:47:38','Fernando Aguirre',45,'NO','Luz Aguirre','Hospital S.M','AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','Se brindo atencion medica, y traslado a San Marcos'),(49,6,'Arbol Caido obstculiza la carretera','2026-07-07','En Curso','Caserio El Nance, San Rafael pie de la cuesta, a un costado de la carretera',NULL,'Alexis Sandoval','47975596','2026-07-07 17:07:07','2026-07-07 17:07:13',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Jonathan Sandoval, Juan Pérez','Se removio el arbol caido danto paso a los automoviles'),(52,2,'dos carros chocan y dejan a 3 heridos','2026-07-08','En Curso','Nuevo San Rafael, a un costado de la carretera',NULL,'Pedro Hernandez','56421561','2026-07-08 16:45:39','2026-07-08 16:46:54','Palma Rivas',45,'NO','Magna Rivas','Hospital General San Marcos','P-132FMT - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','[VÍCTIMAS ADICIONALES ATENDIDAS]:\n  2. Luisa Rivas | 45 años \n  3. Leticia Rivas | 54 años \n\nse brinda atención medica y se traslada a San Marcos\n\n[FIRMA VOBO]: Alexis Ronay Sandoval Ríos | Jefe de Turno'),(53,7,'Aparece una serpiente','2026-07-08','En Curso','Canton Marical 1 San Rafael Pie de la cuesta,, Referencia: A la par de tienda Luisa',NULL,'Karla Mazariegos','54654556','2026-07-08 16:55:32','2026-07-08 16:55:41',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','Se rescata serpiente y se lleva a su habita\n\n[FIRMA VOBO]: Alexis Ronay Sandoval Ríos | Jefe de Turno'),(54,6,'Se cae árbol en la calle','2026-07-08','En Curso','Colonia Santa Maria San Rafael Pie de la cuesta,, Referencia: A la par de ferretería Sanchez',NULL,'Carmen De León','46565454','2026-07-08 17:12:20','2026-07-08 17:12:26',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Javier Fernandez Hernández López','Javier Fernandez Hernández López, Pedro Esteban Pérez Guzman','Se remueve el árbol para dar vía a los autos\n\n[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(56,4,'Árbol arde en llamas','2026-07-08','En Curso','Canton Marical II, Referencia: Frente de tienda Carmen',NULL,'Ramiro Ramirez','45645644','2026-07-12 15:36:15','2026-07-12 15:36:37',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Meylin Johayra Sandoval Rios','Javier Fernandez Hernández López','Se controla el fuego\n\n[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(60,2,'Choque de dos autos deja 4 heridos','2026-07-12','En Curso','Caserio el nance San Rafael P.C, Referencia: A un costado de la carretera',NULL,'Alexis Sandoval','47975596','2026-07-12 19:48:58','2026-07-12 19:49:03',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Meylin Johayra Sandoval Rios','Javier Fernandez Hernández López','[CANCELADO / FALSA ALARMA]: Llamada de broma / Falsa alarma malintencionada\n\nno se brindo atencion\n\n[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(63,4,'Se incendia Casa','2026-07-12','En Curso','Canton Mariscal 1 San Rafael P.C, Referencia: Frente a cancha Ramirez',NULL,'Maynor Pérez','45878956','2026-07-12 20:39:38','2026-07-12 20:39:45',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA, P-132FMT - TOYOTA','Meylin Johayra Sandoval Rios','Javier Fernandez Hernández López','[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(64,5,'Cae Poste electrico y persona se electrocuta','2026-07-12','En Curso','San Rafael Pie de la cuetas, Centro, Referencia: Frente a Mercado',NULL,'Maria Hernandez','65894587','2026-07-12 21:03:58','2026-07-12 21:04:05','Pedro Aguirre',45,'NO','Maria Perez','Centro Medico Jireh','P-132FMT - TOYOTA','Meylin Johayra Sandoval Rios','Javier Fernandez Hernández López','Se brindo atencion medica y traslado a centro medico\n\n[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(65,7,'Perro atropellado','2026-07-13','En Curso','Caserio El Nance, San rafael P.C, Referencia: Frente a tienda molina',NULL,'Carlos Morales','12561565','2026-07-13 13:57:30','2026-07-13 13:57:33',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Meylin Johayra Sandoval Rios','Ronay Ríos','Se brinda atencion medica al perro, y se lleva a una veterinaria\n\n[FIRMA VOBO]: Javier Fernandez Hernández López | Jefe de Compañía'),(66,2,'Chocaron dos carros dejando  2 heridos','2026-07-15','En Curso','Caserio El Nance, San Rafael Pie de la cuesta, Referencia: A un costado de la carretera',NULL,'Meylin Sandoval','45455645','2026-07-15 13:54:42','2026-07-15 13:54:50','Carlos Ramirez',45,'NO','Carlos Rodriguez','Hospital General S.M','AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','[VÍCTIMAS ADICIONALES ATENDIDAS]:\n  2. Fernando Lopez | 25 años \n  3. Miguel Aguirre | 48 años (FALLECIDO)\n\nSe brinda atencion medica y se traslada al hospital general\n\n[FIRMA VOBO]: Pedro Juan Castillo De León | Jefe de Turno'),(67,5,'Se electrocuto','2026-07-18','En Curso','San Pedro Sacatepequez, Referencia: Santa Ana',NULL,'Francisco Sandoval','45454564','2026-07-18 10:17:22','2026-07-18 10:17:55','Carlos Perez',45,'NO',NULL,'Hospital Nacional','AB-12346 - TOYOTA','Fernando Alejandro Ramos De León','Juan Pérez, Jonathan Sandoval','Se brindo atencion medica y se llevo al hospitla\n\n[FIRMA VOBO]: Pedro Juan Castillo De León | Jefe de Turno'),(68,2,'Moto pierde los frenos e impacta en un arbol','2026-07-19','En Curso','Colonia Santa Maria, Referencia: Frente a Tienda Don Jorge',NULL,'Luis Garcia','54561651','2026-07-19 19:18:08','2026-07-19 19:23:00',NULL,NULL,'NO',NULL,NULL,'AB-12346 - TOYOTA','Juan Pérez','Pedro Esteban Pérez Guzman, Ronay Ríos','[CANCELADO / FALSA ALARMA]: Situación controlada por civiles\n\nlas personas controlaron el caso\n\n[FIRMA VOBO]: Pedro Juan Castillo De León | Jefe de Turno'),(69,6,'Se cae Arbol en carretera','2026-07-19','En Curso','San Rafafael Pie de la cuesta, Referencia: La Calzada, frente a iglesia de Dios',NULL,'Pedro Godinez','45649841','2026-07-19 19:20:43','2026-07-19 19:24:58',NULL,NULL,'NO',NULL,NULL,'P-132FMT - TOYOTA','Fernando Alejandro Ramos De León','Jonathan Sandoval','se abre paso a la carretera quitando al arbol del camino\n\n[FIRMA VOBO]: Pedro Juan Castillo De León | Jefe de Turno'),(71,7,'se encuentra un serpiente en carretera','2026-07-19','En Curso','Caserio EL Nance, Referencia: Frente a Taller',NULL,'Maria Perez','45646564',NULL,NULL,NULL,NULL,'NO',NULL,NULL,NULL,NULL,NULL,'');
/*!40000 ALTER TABLE `tb_servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_tipo_servicios`
--

DROP TABLE IF EXISTS `tb_tipo_servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_tipo_servicios` (
  `ID_TIPO_S` int NOT NULL AUTO_INCREMENT,
  `TIPO_SERVICIO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CATEGORIA` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Emergencia',
  `DESCRIPCION` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PRIORIDAD` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Media',
  `ID_TIPO_V` int DEFAULT NULL,
  PRIMARY KEY (`ID_TIPO_S`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_tipo_servicios`
--

LOCK TABLES `tb_tipo_servicios` WRITE;
/*!40000 ALTER TABLE `tb_tipo_servicios` DISABLE KEYS */;
INSERT INTO `tb_tipo_servicios` VALUES (2,'Accidente de Tránsito','Emergencia','Brindar atención médica prehospitalaria, rescate vehicular (liberación de personas atrapadas usando equipo hidráulico), control de riesgos en la escena (prevención de incendios y contención de derrames de combustible), y el traslado seguro de los heridos a centros asistenciales.','Alta',9),(4,'Incendio Forestal','Servicio','incendio en el bosque de san Rafael','Alta',5),(5,'Choque eléctrico / Electrocución','Emergencia','Lesiones provocadas por el paso de corriente eléctrica a través del cuerpo.','Alta',1),(6,'Árbol Caido','Servicio','Cortar y trozar el árbol para despejar la vía pública, liberar bienes o personas atrapadas, y prevenir accidentes','Media',3),(7,'Rescate De Animal','Servicio','Rescate de animales en situaciones de peligro (como caídas a barrancos, estar atrapados o lastimados).','Baja',9);
/*!40000 ALTER TABLE `tb_tipo_servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_tipo_vehiculo`
--

DROP TABLE IF EXISTS `tb_tipo_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_tipo_vehiculo` (
  `ID_TIPO_V` int NOT NULL AUTO_INCREMENT,
  `TIPO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_TIPO_V`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_tipo_vehiculo`
--

LOCK TABLES `tb_tipo_vehiculo` WRITE;
/*!40000 ALTER TABLE `tb_tipo_vehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_tipo_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_vehiculo`
--

DROP TABLE IF EXISTS `tb_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_vehiculo` (
  `ID_VEHICULO` int NOT NULL AUTO_INCREMENT,
  `MARCA` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MODELO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ANIO` int DEFAULT NULL,
  `PLACA` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NUMERO_UNIDAD` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ID_TIPO_V` int DEFAULT NULL,
  `ID_ESTADO_V` int DEFAULT NULL,
  `KILOMETRAJE_ACTUAL` decimal(10,2) DEFAULT NULL,
  `CHASIS` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MOTOR` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FECHA_INGRESO` date DEFAULT NULL,
  `OBSERVACIONES` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ID_VEHICULO`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_vehiculo`
--

LOCK TABLES `tb_vehiculo` WRITE;
/*!40000 ALTER TABLE `tb_vehiculo` DISABLE KEYS */;
INSERT INTO `tb_vehiculo` VALUES (1,'TOYOTA','Hicae',2020,'AB-12346','B-101',4,2,4500.16,'JTHBF54G6P5XXXXXX','22R0000000','2024-10-09','Actualmente tiene problemas de motor'),(3,'TOYOTA','Land Cruiser',2018,'P-132FMT','B-102',1,1,2600.00,'JTEHJ71J004183952','1HZ-4201837','2026-07-06','Nuevo ingreso de Ambulancia');
/*!40000 ALTER TABLE `tb_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_emergencia`
--

DROP TABLE IF EXISTS `tipo_emergencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_emergencia` (
  `id_tipo_emergencia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_tipo_emergencia`),
  UNIQUE KEY `uq_tipo_emergencia_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_emergencia`
--

LOCK TABLES `tipo_emergencia` WRITE;
/*!40000 ALTER TABLE `tipo_emergencia` DISABLE KEYS */;
INSERT INTO `tipo_emergencia` VALUES (1,'Incendio Estructural','Fuego en edificaciones.',1),(2,'Incendio Forestal','Fuego en áreas boscosas.',1),(3,'Incendio Vehicular','Fuego en automóvil.',1),(4,'Accidente de Tránsito','Colisión en vía pública.',1),(5,'Emergencia Médica','Atención prehospitalaria.',1),(6,'Rescate en Altura','Personas atrapadas en estructuras.',1),(7,'Rescate en Agua','Personas en ríos o lagos.',1),(8,'Fuga de Gas','Escape de gas doméstico o industrial.',1),(9,'Derrumbe / Colapso','Derrumbe de tierra.',1),(10,'Materiales Peligrosos (MATPEL)','Derrame tóxico.',1),(11,'Apoyo Interinstitucional','Apoyo a PNC, CONRED, Ejército.',1);
/*!40000 ALTER TABLE `tipo_emergencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_insumo`
--

DROP TABLE IF EXISTS `tipo_insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_insumo` (
  `id_tipo_insumo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_tipo_insumo`),
  UNIQUE KEY `uq_tipo_insumo_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_insumo`
--

LOCK TABLES `tipo_insumo` WRITE;
/*!40000 ALTER TABLE `tipo_insumo` DISABLE KEYS */;
INSERT INTO `tipo_insumo` VALUES (1,'Material Médico','Vendas, guantes, sueros.'),(2,'Equipo de Protección (EPP)','Cascos, trajes, botas.'),(3,'Material Contra Incendios','Espuma, extintores.'),(4,'Herramienta Manual','Hachas, palas.'),(5,'Combustible','Diesel y gasolina.');
/*!40000 ALTER TABLE `tipo_insumo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_vehiculo`
--

DROP TABLE IF EXISTS `tipo_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_vehiculo` (
  `id_tipo_vehiculo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_tipo_vehiculo`),
  UNIQUE KEY `uq_tipo_vehiculo_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_vehiculo`
--

LOCK TABLES `tipo_vehiculo` WRITE;
/*!40000 ALTER TABLE `tipo_vehiculo` DISABLE KEYS */;
INSERT INTO `tipo_vehiculo` VALUES (1,'Autobomba','Unidad equipada con bomba de agua.'),(2,'Ambulancia','Unidad médica prehospitalaria.'),(3,'Rescate','Unidad con equipo pesado.'),(4,'Escalera','Unidad con escalera telescópica.'),(5,'Cisterna','Abastecimiento hídrico.'),(6,'Mando','Vehículo de coordinación.');
/*!40000 ALTER TABLE `tipo_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requiere_cambio` tinyint(1) NOT NULL DEFAULT '0',
  `intentos_fallidos` int DEFAULT '0',
  `bloqueado_hasta` datetime DEFAULT NULL,
  `dpi` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_usr` (`nombre_usuario`),
  UNIQUE KEY `uq_usuario_dpi` (`dpi`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin','$2a$10$lk4h2gFUbI.qD78qI9uhT.aVsjw7pjxcRb14pFY9nP0GXD3m/BQYu',0,0,NULL,'0000000000000',1,1,'2026-06-20 11:45:51'),(5,'Alexis','$2a$10$E6hxSDg58bqElx9Jt4/bW.H0jh/NF4YCuR0T14KoE5IyXdE2lQKWW',0,0,NULL,'1254561561564',1,1,'2026-07-12 08:34:42'),(38,'jsandoval','$2a$10$UXvVU52Zr8/wC8aioqMmqe/YIy.qANl8RLtkbihj7fRH6gvtuEdda',0,0,NULL,'4502165160101',2,1,'2026-07-26 20:21:10');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo`
--

DROP TABLE IF EXISTS `vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo` (
  `id_vehiculo` int NOT NULL AUTO_INCREMENT,
  `placas` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_tipo_vehiculo` int NOT NULL,
  `no_unidad` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_estado_vehiculo` int NOT NULL,
  PRIMARY KEY (`id_vehiculo`),
  UNIQUE KEY `uq_vehiculo_placas` (`placas`),
  UNIQUE KEY `uq_vehiculo_unidad` (`no_unidad`),
  KEY `fk_vehiculo_tipo` (`id_tipo_vehiculo`),
  KEY `fk_vehiculo_estado` (`id_estado_vehiculo`),
  CONSTRAINT `fk_vehiculo_estado` FOREIGN KEY (`id_estado_vehiculo`) REFERENCES `estado_vehiculo` (`id_estado_vehiculo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_vehiculo_tipo` FOREIGN KEY (`id_tipo_vehiculo`) REFERENCES `tipo_vehiculo` (`id_tipo_vehiculo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo`
--

LOCK TABLES `vehiculo` WRITE;
/*!40000 ALTER TABLE `vehiculo` DISABLE KEYS */;
INSERT INTO `vehiculo` VALUES (1,'AB-1234','Hino','Ranger 2019',1,'B-101',1),(2,'CD-5678','Toyota','HiAce 2020',2,'A-201',1);
/*!40000 ALTER TABLE `vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_bomberos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-01 17:01:46
