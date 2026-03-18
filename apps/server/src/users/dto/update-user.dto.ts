import { IsString, IsOptional, MinLength, MaxLength, Matches, IsUrl } from 'class-validator';

/**
 * DTO for PATCH /users/me — strict validation of profile updates.
 * Only whitelisted fields are accepted (via ValidationPipe whitelist: true).
 */
export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    @MaxLength(20, { message: 'El nombre no puede tener más de 20 caracteres' })
    @Matches(/^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$/, {
        message: 'El nombre solo puede contener letras, números y guiones bajos',
    })
    username?: string;

    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'La URL del avatar no es válida' })
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(3)
    @Matches(/^[A-Z]{2,3}$/, { message: 'Código de país inválido (ej: CL, US, AR)' })
    country?: string;
}
