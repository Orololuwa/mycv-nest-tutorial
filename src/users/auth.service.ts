import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    //  See if email is in use
    const users = await this.usersService.find(email);

    if (users.length) throw new BadRequestException('Email in use');

    // Generate salt
    const salt = randomBytes(8).toString('hex');

    // Hash users password
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join the string
    const result = salt + '.' + hash.toString('hex');

    // Create a new user and save it
    const user = await this.usersService.create(email, result);

    // return the User
    return user;
  }

  async signin(email: string, password: string) {
    // Find user and check if exists
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // get the salt hashed password and compare with the password been sent by the user
    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (hash.toString('hex') !== storedHash) {
      throw new BadRequestException('Incorrect password');
    }

    return user;
  }
}
