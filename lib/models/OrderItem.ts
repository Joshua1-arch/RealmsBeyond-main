import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  order_id: mongoose.Types.ObjectId;
  product_id?: mongoose.Types.ObjectId;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  weight?: string;
  dimensions?: string;
  created_at: Date;
}

const OrderItemSchema: Schema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    product_name: { type: String, required: true },
    product_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    weight: { type: String },
    dimensions: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export default mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
