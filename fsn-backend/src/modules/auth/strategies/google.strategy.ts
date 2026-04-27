import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleUser {
  oauthId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  oauthProvider: 'google';
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, emails, photos, displayName } = profile;

    const user: GoogleUser = {
      oauthId: id,
      email: emails?.[0]?.value || '',
      fullName: displayName,
      avatarUrl: photos?.[0]?.value || '',
      oauthProvider: 'google',
    };

    done(null, user);
  }
}
