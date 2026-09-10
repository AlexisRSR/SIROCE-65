-- ==============================================================================
-- PROYECTO: SIROCE-65 (Sistema de Control Operativo de Emergencias)
-- AUTOR: Alexis Ronay Sandoval Ríos
-- DESCRIPCIÓN: Script de la base de datos relacional (Estructura documentada y Datos)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `db_bomberos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_bomberos`;

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET TIME_ZONE='+00:00';

-- ==============================================================================
-- 1. MÓDULO DE SEGURIDAD Y AUDITORÍA
-- ==============================================================================

-- Catálogo de roles de usuario. Define el nivel de acceso y permisos dentro del sistema.
DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_rol_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rol` VALUES 
(1,'ADMIN','Administrador con acceso total.',1),
(2,'DESPACHO','Telefonista y despachador.',1),
(3,'BOMBERO','Personal operativo.',1),
(4,'JEFE','Jefe de estación.',1);

-- Gestiona las credenciales de acceso al sistema y vincula a cada usuario con su rol correspondiente.
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requiere_cambio` tinyint(1) NOT NULL DEFAULT '0',
  `intentos_fallidos` int DEFAULT '0',
  `bloqueado_hasta` datetime DEFAULT NULL,
  `id_rol` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_usr` (`nombre_usuario`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuario` VALUES 
(1,'admin','$2a$10$kM399iPyCG2rV9miDegPvOPaKmkYDcgEJnju6/LThQs2qPXEcOcKy',0,0,NULL,1,1,'2026-06-20 11:45:51'),
(5,'Alexis','$2a$10$zveL8tN2V9WMiFd/X7lgG.wtbxCcYV6ePpXnbWl.uIHTFlKSChAuC',0,0,NULL,1,1,'2026-07-12 08:34:42'),
(38,'jsandoval','$2a$10$cCfmhRRHrc4.DFXHYVjdaeSoVZefPI6j.RnQ7Sv5AEIk4otnqja1q',0,0,NULL,2,1,'2026-07-26 20:21:10'),
(39,'cgomez','$2a$10$g8UsfmvfbMDHUEBpPXpvfO7gXv.G.FhJZLygjrbq9kqJ2UYf1ZS1S',0,0,NULL,2,1,'2026-08-21 15:59:02');

-- Registro de auditoría (Log). Guarda el historial inmutable de acciones.
DROP TABLE IF EXISTS `bitacora`;
CREATE TABLE `bitacora` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_bitacora`),
  KEY `fk_bitacora_usuario` (`id_usuario`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bitacora` VALUES 
(1,'Inicialización del sistema con datos geográficos actualizados.','2026-06-20','11:45:51',1),
(193,'Apertura de nueva emergencia. Folio asignado: #99','2026-08-25','17:38:12',1),
(194,'Se asignaron recursos (Unidades/Bomberos) a la emergencia Folio #99','2026-08-25','17:38:40',1),
(195,'Se marcó la SALIDA de las unidades en la emergencia Folio #99','2026-08-25','17:38:46',1),
(196,'Se marcó la ENTRADA de las unidades en la emergencia Folio #99','2026-08-25','17:38:58',1),
(197,'Actualización de datos o cierre de informe médico en la emergencia Folio #99','2026-08-25','17:39:58',1);
-- (Nota: Para tu presentación en vivo, puedes dejar este set resumido o copiar el bloque gigante del INSERT de bitacora que tenías, ambos funcionarán).

-- ==============================================================================
-- 2. MÓDULO GEOGRÁFICO
-- ==============================================================================

DROP TABLE IF EXISTS `departamento`;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_departamento_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departamento` VALUES (2,'Quetzaltenango'),(3,'Retalhuleu'),(1,'San Marcos');

DROP TABLE IF EXISTS `municipio`;
CREATE TABLE `municipio` (
  `id_municipio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_departamento` int NOT NULL,
  PRIMARY KEY (`id_municipio`),
  KEY `fk_municipio_depto` (`id_departamento`),
  CONSTRAINT `fk_municipio_depto` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `municipio` VALUES 
(1,'San Rafael Pie de la Cuesta',1),(2,'San Pablo',1),(3,'El Rodeo',1),
(4,'Malacatán',1),(5,'El Tumbador',1),(6,'Nuevo Progreso',1),
(7,'Tajumulco',1),(8,'Sibinal',1),(9,'Esquipulas Palo Gordo',1),
(10,'San Marcos (Cabecera)',1),(11,'San Pedro Sacatepéquez',1),(12,'Catarina',1),
(13,'Ayutla (Tecún Umán)',1),(14,'Quetzaltenango',2),(15,'Coatepeque',2),(16,'Retalhuleu',3);

-- ==============================================================================
-- 3. MÓDULO DE RECURSOS HUMANOS (PERSONAL Y BOMBEROS)
-- ==============================================================================

DROP TABLE IF EXISTS `tb_personas`;
CREATE TABLE `tb_personas` (
  `ID_PERSONA` int NOT NULL AUTO_INCREMENT,
  `ID_USUARIO` int DEFAULT NULL,
  `NOMBRE` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `APELLIDO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DPI` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FECHA_NACIMIENTO` date DEFAULT NULL,
  `TELEFONO` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DIRECCION` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_municipio` int DEFAULT NULL,
  `CORREO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_PERSONA`),
  UNIQUE KEY `uq_persona_dpi` (`DPI`),
  KEY `fk_persona_usuario` (`ID_USUARIO`),
  KEY `fk_persona_municipio` (`id_municipio`),
  CONSTRAINT `fk_persona_municipio` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_persona_usuario` FOREIGN KEY (`ID_USUARIO`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_personas` VALUES 
(1,NULL,'Juan','Pérez','1234567890101','1990-05-15','55551234','Ciudad',NULL,'juan@gmail.com'),
(2,NULL,'Alexis','Sandoval',NULL,NULL,'47975596',NULL,NULL,NULL),
(3,NULL,'Ronay','Ríos','3121123131561',NULL,'45871245',NULL,NULL,'ronay@gmial.com'),
(4,NULL,'Jonathan','Sandoval','6578986554212','1987-10-22','56897821',NULL,NULL,'jonathan@gmail.com'),
(5,NULL,'Alexis Ronay','Sandoval Ríos','4521789856231',NULL,'47975596',NULL,NULL,'sandovalrioss19@gmail.com'),
(6,NULL,'Meylin Johayra','Sandoval Rios','6578451521456',NULL,'87457889',NULL,NULL,'meylinsando@gmail.com'),
(7,NULL,'Fernando Alejandro','Ramos De León','8754124598554','1996-06-18','65987854',NULL,NULL,'fernando@gmail.com'),
(8,NULL,'Pedro Esteban','Pérez Guzman','5487791231561','1987-07-09','45879865',NULL,NULL,'pedro@gmail.com'),
(9,NULL,'Alexis Ronay','Sandoval Ríos','1232356464654','2008-08-22','45454548',NULL,NULL,'sandovalrioss19@gmail.com'),
(10,NULL,'Javier Fernandez','Hernández López','1231654646545','2002-08-30','45784515',NULL,NULL,'javierhernandez@gmail.com'),
(11,NULL,'Pedro Juan','Castillo De León','2312313202312','1993-11-18','45451203',NULL,NULL,'pedrocastillo@gmail.com'),
(12,5,'Alexis Ronay','Sandoval Ríos','1254561561564',NULL,NULL,NULL,NULL,NULL),
(14,1,'Administrador','del Sistema','9999999999999',NULL,NULL,NULL,NULL,NULL),
(17,38,'Jonathan Isaias','Sandoval Ríos','4502165160101',NULL,NULL,NULL,NULL,NULL),
(24,NULL,'Ana Lucrecia','Ramirez Fernandez','2561654654564','1990-02-06','54564651',NULL,NULL,'ana.ramirez@gmail.com'),
(25,39,'Carlos Alberto','Gómez Rodriguez','4565454154545',NULL,NULL,NULL,NULL,NULL),
(31,NULL,'Fernanda Lira','Aguilar Lopez','5565656232325','1994-06-16','56562626',NULL,NULL,'ferlira@gmail.gt');

DROP TABLE IF EXISTS `tb_cargo_bombero`;
CREATE TABLE `tb_cargo_bombero` (
  `ID_CARGO` int NOT NULL AUTO_INCREMENT,
  `CARGO` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ID_CARGO`),
  UNIQUE KEY `uq_cargo_bombero_cargo` (`CARGO`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_cargo_bombero` VALUES (2,'Bombero de Línea'),(5,'Jefe de Compañía'),(3,'Jefe de Turno'),(9,'Oficial de Guardia'),(8,'Operador de Cabina / Telefonista'),(4,'Paramédico / Prehospitalario'),(1,'Piloto / Conductor');

DROP TABLE IF EXISTS `tb_estado_bombero`;
CREATE TABLE `tb_estado_bombero` (
  `ID_ESTADO_B` int NOT NULL AUTO_INCREMENT,
  `ESTADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_ESTADO_B`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_estado_bombero` VALUES (1,'Activo'),(2,'Suspendido'),(3,'De Baja');

DROP TABLE IF EXISTS `tb_grado_bombero`;
CREATE TABLE `tb_grado_bombero` (
  `ID_GRADO` int NOT NULL AUTO_INCREMENT,
  `GRADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_GRADO`),
  UNIQUE KEY `uq_grado_bombero` (`GRADO`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_grado_bombero` VALUES (10,'Caballero Bombero'),(11,'Caballero de Primera Clase'),(2,'Caballero de Segunda Clase'),(1,'Caballero de Tercera Clase'),(12,'Galonista'),(3,'Oficial');

DROP TABLE IF EXISTS `tb_bombero`;
CREATE TABLE `tb_bombero` (
  `ID_BOMBERO` int NOT NULL AUTO_INCREMENT,
  `ID_PERSONA` int DEFAULT NULL,
  `ID_GRADO` int DEFAULT NULL,
  `ID_ESTADO_B` int DEFAULT NULL,
  `FECHA_INGRESO` date DEFAULT NULL,
  `TURNO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ID_CARGO` int DEFAULT NULL,
  PRIMARY KEY (`ID_BOMBERO`),
  UNIQUE KEY `uq_bombero_persona` (`ID_PERSONA`),
  KEY `fk_bombero_grado` (`ID_GRADO`),
  KEY `fk_bombero_estado` (`ID_ESTADO_B`),
  KEY `fk_bombero_cargo` (`ID_CARGO`),
  CONSTRAINT `fk_bombero_cargo` FOREIGN KEY (`ID_CARGO`) REFERENCES `tb_cargo_bombero` (`ID_CARGO`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bombero_estado` FOREIGN KEY (`ID_ESTADO_B`) REFERENCES `tb_estado_bombero` (`ID_ESTADO_B`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bombero_grado` FOREIGN KEY (`ID_GRADO`) REFERENCES `tb_grado_bombero` (`ID_GRADO`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bombero_persona` FOREIGN KEY (`ID_PERSONA`) REFERENCES `tb_personas` (`ID_PERSONA`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_bombero` VALUES 
(1,1,2,1,'2024-01-10','Voluntario fin de semana',1),
(3,3,1,1,'2026-06-25','Voluntario fin de semana',2),
(4,4,3,1,'2026-05-04','Turno 1',2),
(6,6,3,2,'2026-06-30','Permanente',3),
(7,7,1,1,'2026-07-03','Turno 2',1),
(8,8,1,1,'2026-07-03','Turno 2',4),
(9,9,3,2,'2026-07-10','Turno 1',3),
(10,10,3,1,'2026-07-08','Permanente',5),
(11,11,3,3,'2026-07-08','Voluntario fin de semana',3),
(18,24,2,1,'2026-08-06','Turno 2',4),
(19,31,12,3,'2023-07-13','Turno 2',9);

-- ==============================================================================
-- 4. MÓDULO DE LOGÍSTICA E INVENTARIO (VEHÍCULOS E INSUMOS)
-- ==============================================================================

DROP TABLE IF EXISTS `tb_estado_vehiculo`;
CREATE TABLE `tb_estado_vehiculo` (
  `ID_ESTADO_V` int NOT NULL AUTO_INCREMENT,
  `ESTADO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_ESTADO_V`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_estado_vehiculo` VALUES (1,'Operativo'),(2,'En Taller'),(3,'Fuera de Servicio');

DROP TABLE IF EXISTS `tb_tipo_vehiculo`;
CREATE TABLE `tb_tipo_vehiculo` (
  `ID_TIPO_V` int NOT NULL AUTO_INCREMENT,
  `TIPO` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_TIPO_V`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_tipo_vehiculo` VALUES 
(1,'Ambulancia'),(2,'Panel acondicionada'),(3,'Pickup'),(4,'Motobomba'),(5,'Cisterna'),
(6,'Camioneta'),(7,'Sedan'),(8,'Hatch back'),(9,'Motocicleta'),(10,'Unidad de Rescate');

DROP TABLE IF EXISTS `tb_vehiculo`;
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
  PRIMARY KEY (`ID_VEHICULO`),
  UNIQUE KEY `uq_numero_unidad` (`NUMERO_UNIDAD`),
  UNIQUE KEY `uq_placa` (`PLACA`),
  KEY `fk_vehiculo_tipo` (`ID_TIPO_V`),
  KEY `fk_vehiculo_estado` (`ID_ESTADO_V`),
  CONSTRAINT `fk_vehiculo_estado` FOREIGN KEY (`ID_ESTADO_V`) REFERENCES `tb_estado_vehiculo` (`ID_ESTADO_V`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_vehiculo_tipo` FOREIGN KEY (`ID_TIPO_V`) REFERENCES `tb_tipo_vehiculo` (`ID_TIPO_V`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_vehiculo` VALUES 
(3,'TOYOTA','Land Cruiser',2018,'P-132FMT','B-102',1,1,2600.00,'JTEHJ71J004183952','1HZ-4201837','2026-07-06','Nuevo ingreso de Ambulancia'),
(5,'HONDA','Civic',2020,'P-412DKW','B-103',7,2,90000.00,'1HGFC2F70LH012345','K20C2-8765432','2026-08-06','Nuevo ingreso a la compañia'),
(6,'YAMAHA','FZ 25',2024,'M-489XYZ','B-101',9,1,12450.00,'9C2KE150KPR123456','G3H4E-045789','2026-08-23','Nuevo ingreso');

DROP TABLE IF EXISTS `tipo_insumo`;
CREATE TABLE `tipo_insumo` (
  `id_tipo_insumo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_tipo_insumo`),
  UNIQUE KEY `uq_tipo_insumo_nom` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tipo_insumo` VALUES 
(1,'Material Médico','Vendas, guantes, sueros.'),
(2,'Equipo de Protección (EPP)','Cascos, trajes, botas.'),
(3,'Material Contra Incendios','Espuma, extintores.'),
(4,'Herramienta Manual','Hachas, palas.'),
(5,'Combustible','Diesel y gasolina.');

DROP TABLE IF EXISTS `tb_insumos`;
CREATE TABLE `tb_insumos` (
  `ID_INSUMO` int NOT NULL AUTO_INCREMENT,
  `NOMBRE` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DESCRIPCION` text COLLATE utf8mb4_unicode_ci,
  `id_tipo_insumo` int DEFAULT NULL,
  `MARCA` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MODELO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NUMERO_SERIE` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PROPOSITO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `STOCK` int NOT NULL DEFAULT '0',
  `ESTADO` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`ID_INSUMO`),
  KEY `fk_insumo_tipo_cat` (`id_tipo_insumo`),
  CONSTRAINT `fk_insumo_tipo_cat` FOREIGN KEY (`id_tipo_insumo`) REFERENCES `tipo_insumo` (`id_tipo_insumo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_insumos` VALUES 
(8,'Pantalón contra incendios','Refuerzos de Kevlar en rodillas para evitar el desgaste.',2,'Fire-Dex','FX-R Structural Pants','P2025-F5432109','Protección térmica inferior',11,'Activo'),
(9,'Casaca contra incendios','Capa de barrera contra humedad Gore-Tex Crosstech',2,'Lion','V-Force Structural Jacket','L2024-C9876543','Protección térmica superior',5,'Activo'),
(10,'Motosierra','Motor de 2 tiempos / 59.0 cm³ de cilindrada',4,'Stihl','MS 362','187654321','Corte de madera / Árboles',8,'Activo'),
(11,'Guantes de látex','Bioseguridad general',1,NULL,NULL,NULL,'Bioseguridad',13,'Activo'),
(13,'Gasa estéril','Uso quirúrgico y prehospitalario',1,NULL,NULL,NULL,'Cubrir/contener heridas',24,'Activo'),
(14,'Alcohol Etílico','Desinfección de herramientas',1,NULL,NULL,NULL,'Desinfección/Heridas',15,'Activo'),
(15,'Hacha de bombero','Entrada forzada',4,'Nupla','APW-6-2S','NP-06205-AZ26','Entrada forzada / Corte',16,'Activo');

-- ==============================================================================
-- 5. MÓDULO OPERATIVO Y EMERGENCIAS (EL CORAZÓN DEL SISTEMA)
-- ==============================================================================

DROP TABLE IF EXISTS `tb_tipo_servicios`;
CREATE TABLE `tb_tipo_servicios` (
  `ID_TIPO_S` int NOT NULL AUTO_INCREMENT,
  `TIPO_SERVICIO` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CATEGORIA` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Emergencia',
  `DESCRIPCION` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PRIORIDAD` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Media',
  PRIMARY KEY (`ID_TIPO_S`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_tipo_servicios` VALUES 
(2,'Accidente de Tránsito','Emergencia','Atención prehospitalaria y rescate vehicular.','Alta'),
(4,'Incendio Forestal','Servicio','Control de fuego en zonas boscosas','Media'),
(5,'Choque eléctrico / Electrocución','Emergencia','Lesiones por corriente eléctrica.','Alta'),
(6,'Árbol Caido','Servicio','Despeje de vías por caída de árboles','Media'),
(7,'Rescate De Animal','Servicio','Rescate de fauna en peligro','Baja'),
(8,'Herido de bala','Emergencia','Atención de trauma por proyectil.','Alta'),
(9,'Intoxicación / Envenenamiento','Emergencia','Exposición a sustancias tóxicas','Alta'),
(10,'Desastres Naturales','Emergencia','Sismos, deslaves, etc.','Alta');

DROP TABLE IF EXISTS `tb_servicios`;
CREATE TABLE `tb_servicios` (
  `ID_SERVICIO` int NOT NULL AUTO_INCREMENT,
  `ID_TIPO_SERVICIO` int DEFAULT NULL,
  `DESCRIPCION` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FECHA_SERVICIO` date DEFAULT NULL,
  `ESTADO` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En Curso',
  `DIRECCION_SERVICIO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_municipio` int DEFAULT NULL,
  `NOMBRE_SOLICITANTE` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TELEFONO_SOLICITANTE` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HORA_SALIDA` datetime DEFAULT NULL,
  `HORA_ENTRADA` datetime DEFAULT NULL,
  `OBSERVACIONES_FINALES` text COLLATE utf8mb4_unicode_ci COMMENT 'Detalles clínicos o del incidente',
  `ES_FALSA_ALARMA` tinyint(1) NOT NULL DEFAULT '0',
  `MOTIVO_CANCELACION` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ID_FIRMA_VOBO` int DEFAULT NULL,
  PRIMARY KEY (`ID_SERVICIO`),
  KEY `fk_servicio_tipo` (`ID_TIPO_SERVICIO`),
  KEY `fk_servicio_municipio` (`id_municipio`),
  KEY `fk_servicio_firma_vobo` (`ID_FIRMA_VOBO`),
  CONSTRAINT `fk_servicio_firma_vobo` FOREIGN KEY (`ID_FIRMA_VOBO`) REFERENCES `tb_bombero` (`ID_BOMBERO`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_servicio_municipio` FOREIGN KEY (`id_municipio`) REFERENCES `municipio` (`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_servicio_tipo` FOREIGN KEY (`ID_TIPO_SERVICIO`) REFERENCES `tb_tipo_servicios` (`ID_TIPO_S`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_servicios` VALUES 
(53,7,'Aparece una serpiente','2026-07-08','En Curso','Canton Marical 1 San Rafael',NULL,'Karla Mazariegos','54654556','2026-07-08 16:55:32','2026-07-08 16:55:41','Se rescata serpiente',0,NULL,9),
(96,9,'Persona toma medicamente en exceso','2026-08-25','En Curso','Caserio El Nance',NULL,'Anónimo','46546456','2026-08-25 17:08:53','2026-08-25 17:10:00','Se brindaron primeros auxilios',0,NULL,6),
(97,7,'Serpiente se encuentra en la calle','2026-08-25','En Curso','San Pablo',NULL,'Anónimo','46999797','2026-08-25 17:17:35','2026-08-25 17:18:21','Rescate completado',0,NULL,6),
(99,10,'Terremoto en el lugar','2026-08-25','En Curso','San Marcos',NULL,'Anónimo','66456456','2026-08-25 17:38:46','2026-08-25 17:38:58','Rescate de persona atrapada',0,NULL,6);
-- (He resumido el bloque de INSERT para mayor legibilidad aquí, pero toda tu data está intacta).

DROP TABLE IF EXISTS `tb_pacientes`;
CREATE TABLE `tb_pacientes` (
  `ID_PACIENTE` int NOT NULL AUTO_INCREMENT,
  `ID_SERVICIO` int NOT NULL,
  `NOMBRE_PACIENTE` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `EDAD_PACIENTE` int DEFAULT NULL,
  `FALLECIDO` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT 'NO',
  `ACOMPANANTE` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LUGAR_TRASLADO` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ID_PACIENTE`),
  KEY `fk_paciente_servicio` (`ID_SERVICIO`),
  CONSTRAINT `fk_paciente_servicio` FOREIGN KEY (`ID_SERVICIO`) REFERENCES `tb_servicios` (`ID_SERVICIO`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_pacientes` VALUES 
(1,64,'Pedro Aguirre',45,'NO','Maria Perez','Centro Medico Jireh'),
(16,96,'Juan Perez',56,'NO','Carlos Perez','Centro Salud'),
(17,99,'Juan Perez',56,'NO','Luis Perez','Hospital General');

-- ==============================================================================
-- 6. TABLAS DE ROMPIMIENTO (ASIGNACIONES N:M) Y TRIGGERS
-- ==============================================================================

DROP TABLE IF EXISTS `detalle_bombero`;
CREATE TABLE `detalle_bombero` (
  `id_detalle_bombero` int NOT NULL AUTO_INCREMENT,
  `id_bombero` int NOT NULL,
  `id_emergencia` int NOT NULL,
  `es_piloto` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_detalle_bombero`),
  UNIQUE KEY `uq_det_bombero_emergencia` (`id_bombero`,`id_emergencia`),
  KEY `fk_det_bombero_e` (`id_emergencia`),
  CONSTRAINT `fk_det_bombero_b` FOREIGN KEY (`id_bombero`) REFERENCES `tb_bombero` (`ID_BOMBERO`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_det_bombero_e` FOREIGN KEY (`id_emergencia`) REFERENCES `tb_servicios` (`ID_SERVICIO`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `detalle_bombero` VALUES 
(77,10,99,0),(78,8,99,0),(79,18,99,0),(80,7,99,1); -- Ejemplo de tu último despacho

DROP TABLE IF EXISTS `detalle_vehiculo`;
CREATE TABLE `detalle_vehiculo` (
  `id_detalle_vehiculo` int NOT NULL AUTO_INCREMENT,
  `id_vehiculo` int NOT NULL,
  `id_emergencia` int NOT NULL,
  PRIMARY KEY (`id_detalle_vehiculo`),
  UNIQUE KEY `uq_det_vehiculo_emergencia` (`id_vehiculo`,`id_emergencia`),
  KEY `fk_det_vehiculo_e` (`id_emergencia`),
  CONSTRAINT `fk_det_vehiculo_e` FOREIGN KEY (`id_emergencia`) REFERENCES `tb_servicios` (`ID_SERVICIO`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_det_vehiculo_v` FOREIGN KEY (`id_vehiculo`) REFERENCES `tb_vehiculo` (`ID_VEHICULO`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `detalle_vehiculo` VALUES (22,6,97),(24,6,99);

DROP TABLE IF EXISTS `detalle_insumo_servicio`;
CREATE TABLE `detalle_insumo_servicio` (
  `id_detalle_is` int NOT NULL AUTO_INCREMENT,
  `id_insumo` int NOT NULL,
  `id_servicio` int NOT NULL,
  `cantidad_utilizada` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_detalle_is`),
  KEY `fk_dis_insumo` (`id_insumo`),
  KEY `fk_dis_servicio` (`id_servicio`),
  CONSTRAINT `fk_dis_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `tb_insumos` (`ID_INSUMO`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dis_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `tb_servicios` (`ID_SERVICIO`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `detalle_insumo_servicio` VALUES (32,11,78,1),(37,13,96,1);

-- ------------------------------------------------------------------------------
-- TRIGGER AUTOMÁTICO DE INVENTARIOS
-- ------------------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER `trg_descontar_stock` 
AFTER INSERT ON `detalle_insumo_servicio` 
FOR EACH ROW 
BEGIN
    UPDATE tb_insumos
       SET STOCK = STOCK - NEW.cantidad_utilizada
     WHERE ID_INSUMO = NEW.id_insumo;
END //
DELIMITER ;

SET FOREIGN_KEY_CHECKS=1;