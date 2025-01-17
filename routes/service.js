import express from "express";
const router = express.Router();
import serviceController from "../controllers/serviceController.js";
import {
  getNumber,
  getOtp,
  numberCancel,
} from "../controllers/servicedatacontroller.js";
import { captureIpMiddleware } from "../middleware/getIPMiddleware.js";

router.get("/admin-api/service-data/get-service-data-admin", serviceController.getUserServicesDataAdmin); //admin dashboard

router.get(
  "/fetch-update-compare-services",
  serviceController.fetchAndStoreServices
); //periodically updates the services on site
router.get("/get-service-server-data", serviceController.getUserServicesDatas); //frontend dashboard

router.get("/get-service", serviceController.getUserServicesData); //Api page logged in user end points

router.post("/addService", serviceController.addService);
router.post("/admin-api/service-update/updateService", serviceController.updateServerMaintenance);
router.post("/admin-api/service-delete/deleteService", serviceController.deleteService);
router.post("/admin-api/getting-server-maintaince/maintainance-server", serviceController.updateServer); //keeping server in maintence
router.post("/admin-api/servers-maintence/maintenance-all-servers", serviceController.updateCentralizedServers); //keeping the maintence of complete site

router.post("/admin-api/updating-service-discount/add-service-discount", serviceController.updateServiceDiscount);

router.get(
  "/admin-api/server-discount-data/get-all-service-discount",
  serviceController.getAllServiceDiscounts
);
router.delete(
  "/admin-api/service-discount-removal/delete-service-discount",
  serviceController.deleteServiceDiscount
);
router.get(
  "/maintenance",
  captureIpMiddleware,
  serviceController.getMaintenanceStatusForServer
);

router.get("/get-number", getNumber);
router.get("/get-otp", getOtp);
router.get("/number-cancel", numberCancel);

export default router;
