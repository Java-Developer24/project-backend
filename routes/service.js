import express from 'express';
const router = express.Router();
import serviceController from '../controllers/serviceController.js';
import {getNumber,getOtp,numberCancel} from "../controllers/servicedatacontroller.js"




router.get("/get-service-data-admin", serviceController.getUserServicesDatas)//admin dashboard 

router.get("/fetch-update-compare-services",serviceController.fetchAndStoreServices)//periodically updates the services on site
router.get('/get-service-server-data',serviceController.getUserServicesDatas)//frontend dashboard

router.get("/get-service", serviceController.getUserServicesData);//Api page logged in user end points


router.post('/addService', serviceController.addService);
router.post('/updateService', serviceController.updateServerMaintenance);
router.post('/deleteService', serviceController.deleteService);
router.post('/maintainance-server', serviceController.updateServer);//keeping server in maintence
router.post("/maintenance-all-servers",serviceController.updateServerDatas)//keeping the maintence of complete site

router.post ("/add-service-discount",serviceController.updateServiceDiscount)

router.get ("/get-all-service-discount",serviceController.getAllServiceDiscounts)
router.delete ("/delete-service-discount",serviceController.deleteServiceDiscount)
router.get("/maintenance",serviceController.getMaintenanceStatusForServer)

router.get("/get-number",getNumber)
router.get("/get-otp", getOtp);
router.get("/number-cancel",numberCancel)

export default router;