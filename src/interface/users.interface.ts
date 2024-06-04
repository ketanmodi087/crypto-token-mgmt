import { Document } from 'mongoose';
export interface IUser extends Document{
    readonly fname: string;
    readonly lname: string;
    readonly dob: string;
    readonly fullname: string;
    readonly email: string;
	readonly phone: string;
	readonly phoneCountry: string;
	readonly currentpre: string;
	readonly city: string;
	readonly location: string;
    readonly wallet_address: string;
	readonly wallet_type: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly bio: string;
    readonly nationality: string;
    readonly res_address: string;
    readonly postal_code: string;
    readonly country_of_issue: string;
    readonly verified_with: string;
    readonly passport_url: Express.Multer.File;
    readonly user_photo_url: Express.Multer.File;
    readonly profile: Express.Multer.File;
    readonly is_verified: number;
    readonly kyc_completed: boolean;
}