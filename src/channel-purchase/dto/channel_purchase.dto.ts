import {IsEmail, IsIn, IsNotEmpty, IsNumber, IsString} from 'class-validator';
  
export class Channel_PurchaseDto {
      
    @IsString({ message: 'FirstName must be a string' })
    @IsNotEmpty({ message: "FirstName can't be empty" })
    first_name: string;
  
    @IsString({ message: 'LastName must be a string' })
    @IsNotEmpty({ message: "LastName can't be empty" })
    last_name: string;
  
    @IsString({ message: 'Phone Number must be a string' })
    @IsNotEmpty({ message: "Phone Number can't be empty" })
    @IsNotEmpty({ message: "Email can't be empty" })
    phone_no: number;
  
    @IsString()
    @IsEmail()
    @IsNotEmpty({ message: "Email can't be empty" })
    email: string;
  
    @IsString()
    @IsNotEmpty()
    @IsIn(['ETB', 'USD'])
    currency: string;
  
    @IsNotEmpty({ message: 'Price cannot be empty' })
    @IsString()
    price: string;
  
    @IsString()
    tax: string;
  
    @IsString()
    total: string;
  
    @IsNotEmpty({ message: 'Channel cannot be empty' })
    @IsString()
    plan: string;

    @IsNotEmpty({ message: 'url cannot be empty' })
    @IsString()
    return_url: string;
  }
  