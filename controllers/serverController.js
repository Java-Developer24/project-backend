// controllers/serverController.js (or serverManagementController.js)
import Service from '../models/service.js';
import {calculateUpdatedPrice,sortServersByPrice, updateServerPrices} from '../utils/helper.js'



export default {
    addServer,
     updateServer,
    deleteServer,
};