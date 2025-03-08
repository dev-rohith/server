import {Schema, model} from 'mongoose'

const pricingSchema = new Schema({
    monthly_price: Number,
    discounted_monthly_price: Number,
    yearly_price: Number,
    discounted_yearly_price: Number
})

const Pricing = model('pricing', pricingSchema)

export default Pricing
