import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
@Schema()
export class User {
	@Prop()
	fname: string;
	@Prop()
	mname: string;
	@Prop()
	lname: string;
	@Prop()
	dob: string;
	@Prop()
	fullname: string;
	@Prop()
	phone: string;
	@Prop()
	phoneCountry: string;
	@Prop()
	email: string;
	@Prop()
	currentpre: string;
	@Prop()
	city: string;
	@Prop()
	location: string;
	@Prop()
	wallet_address: string;
	@Prop()
	wallet_type: string;
	@Prop()
	nonce: string;
	@Prop()
	bio: string;
	@Prop()
	profile: string;
	@Prop()
	created_at: string;
	@Prop()
	updated_at: string;
	@Prop()
	nationality: string;
	@Prop()
	res_address: string;
	@Prop()
	postal_code: string;
	@Prop()
	country_of_issue: string;
	@Prop()
	verified_with: string;
	@Prop()
	passport_url: string;
	@Prop()
	user_photo_url: string;
	@Prop({ default: 0 })
	is_verified: number;
	@Prop({ default: false })
	kyc_completed: boolean;
}	
export const UserSchema = SchemaFactory.createForClass(User);