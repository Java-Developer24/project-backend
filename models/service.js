import mongoose from 'mongoose';
import { serverSchema } from './server.js';

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true },
    servers: [serverSchema],
    lowestPrice: Number,
    service_code: String,
    maintenance: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
}, { timestamps: true });

serviceSchema.pre('save', function (next) {
  if (!this.service_code) {
    this.service_code = this.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  }
  next();
});
// / In service schema
serviceSchema.index({ service_code: 1 });  // Add service_code index for faster querying

serviceSchema.virtual('lowestServerPrice').get(function() {
  if (this.servers && this.servers.length > 0) {
    return Math.min(...this.servers.map(server => server.price));
  }
  return null;
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;
