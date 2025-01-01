// serviceRoutes.js
import express from 'express';
const router = express.Router();
import serviceController from '../controllers/serviceController.js';



// router.get('/fetchAndStoreServices', serviceController.fetchAndStoreServices);
router.get('/fetch-services', serviceController.getUserServicesData);
router.get("/get-service-data-admin", serviceController.getUserServicesData)


router.get('/getServices', serviceController.getUserServicesData);
router.get("/get-services",serviceController.getServiceData)
router.post('/addService', serviceController.addService);
router.post('/updateService', serviceController.updateServerMaintenance);
router.post('/deleteService', serviceController.deleteService);
router.post('/maintainance-server', serviceController.updateServer);
router.post("/maintenance-all-servers",serviceController.updateCentralizedServers)

router.post ("/add-service-discount",serviceController.updateServiceDiscount)

router.get ("/get-all-service-discount",serviceController.getAllServiceDiscounts)
router.delete ("/delete-service-discount",serviceController.deleteServiceDiscount)



export default router;