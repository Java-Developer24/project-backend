import express from "express";
const router = express.Router();
import serviceController from "../controllers/serviceController.js";
import { checkServiceAvailabilitydata, numberCancel1 } from "../controllers/servicedatacontroller.js";
import {
  getNumber,
  getOtp,
 
  numberCancel,
} from "../controllers/servicedatacontroller.js";
import { captureIpMiddleware } from "../middleware/getIPMiddleware.js";

import {authenticateToken} from "../middleware/adminMiddleware.js"

router.get("/admin-api/service-data/get-service-data-admin",authenticateToken, serviceController.getUserServicesDataAdmin); //admin dashboard
router.get("/get-service-server-maintence",checkServiceAvailabilitydata); //admin dashboard
router.get(
  "/admin-api/service-data-update/fetch-update-compare-services",authenticateToken,
  serviceController.fetchAndStoreServices
); //periodically updates the services on site
router.get("/get-service-server-data",captureIpMiddleware, serviceController.getUserServicesDatas); //frontend dashboard

router.get("/get-service",captureIpMiddleware, serviceController.getUserServicesData); //Api page logged in user end points

router.post("/addService", serviceController.addService);
router.post("/admin-api/service-update/updateService",authenticateToken, serviceController.updateServerMaintenance);
router.post("/admin-api/service-delete/deleteService",authenticateToken, serviceController.deleteService);
router.post("/admin-api/getting-server-maintaince/maintainance-server",authenticateToken, serviceController.updateServer); //keeping server in maintence
router.post("/admin-api/servers-maintence/maintenance-all-servers",authenticateToken, serviceController.updateCentralizedServers); //keeping the maintence of complete site

router.post("/admin-api/updating-service-discount/add-service-discount", serviceController.updateServiceDiscount);

router.get(
  "/admin-api/server-discount-data/get-all-service-discount",
  serviceController.getAllServiceDiscounts
);
router.delete(
  "/admin-api/service-discount-removal/delete-service-discount",authenticateToken,
  serviceController.deleteServiceDiscount
);
router.get(
  "/maintenance",
  captureIpMiddleware,
  serviceController.getMaintenanceStatusForServer
);

router.get("/get-number",captureIpMiddleware, getNumber);
router.get("/get-otp",captureIpMiddleware, getOtp);
router.get("/number-cancel",captureIpMiddleware, numberCancel);

router.get("/cancel-number",captureIpMiddleware, numberCancel1);

export default router;
