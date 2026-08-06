import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  user_id?: mongoose.Types.ObjectId;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_state?: string;
  total_amount: number;
  shipping_cost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  paystack_reference?: string;
  paystack_access_code?: string;
  paid_at?: Date;
  // Shipping / Sendbox fields
  courier_name?: string;
  shipping_rate_id?: string;       // Rate ID from Sendbox delivery_quote
  sendbox_shipment_id?: string;    // Shipment ID returned after booking
  tracking_number?: string;
  shipment_status?: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed';
  shipment_booked_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customer_name: { type: String, required: true },
    customer_email: { type: String, required: true, index: true },
    customer_phone: { type: String },
    shipping_address: { type: String, required: true },
    shipping_city: { type: String },
    shipping_state: { type: String },
    total_amount: { type: Number, required: true },
    shipping_cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payment_method: { type: String },
    paystack_reference: { type: String, sparse: true },
    paystack_access_code: { type: String },
    paid_at: { type: Date },
    // Shipping / Sendbox fields
    courier_name: { type: String },
    shipping_rate_id: { type: String },
    sendbox_shipment_id: { type: String, sparse: true },
    tracking_number: { type: String, sparse: true },
    shipment_status: {
      type: String,
      enum: ['pending', 'booked', 'in_transit', 'delivered', 'failed'],
      default: 'pending',
    },
    shipment_booked_at: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
