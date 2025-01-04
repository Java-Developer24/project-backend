// serviceRoutes.js
import express from 'express';
const router = express.Router();
import serviceController from '../controllers/serviceController.js';
import {getNumber,getOtp,numberCancel} from "../controllers/servicedatacontroller.js"



// router.get('/fetchAndStoreServices', serviceController.fetchAndStoreServices);
// router.get('/fetch-services', serviceController.getUserServicesData);
router.get("/get-service-data-admin", serviceController.getUserServicesData)//admin dashboard 

router.get("/fetch-update-compare-services",serviceController.fetchAndStoreServices)
router.get('/get-service-server-data',serviceController.getUserServicesDatas)//frontend dashboard

router.get("/get-service", serviceController.getUserServicesData);


router.post('/addService', serviceController.addService);
router.post('/updateService', serviceController.updateServerMaintenance);
router.post('/deleteService', serviceController.deleteService);
router.post('/maintainance-server', serviceController.updateServer);
router.post("/maintenance-all-servers",serviceController.updateCentralizedServers)

router.post ("/add-service-discount",serviceController.updateServiceDiscount)

router.get ("/get-all-service-discount",serviceController.getAllServiceDiscounts)
router.delete ("/delete-service-discount",serviceController.deleteServiceDiscount)
router.get("/maintenance",serviceController.getMaintenanceStatusForServer)

router.get("/get-number",getNumber)
router.get("/get-otp", getOtp);
router.get("/number-cancel",numberCancel)

export default router;