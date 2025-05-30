import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { VersionRepository } from '@/versions/version.repository';

@Injectable()
export class VersionExistsGuard implements CanActivate {
    constructor(private readonly versionRepository: VersionRepository) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const version = await this.versionRepository.findOne(
            Number(request.params.id),
        );

        if (version) {
            return true;
        }

        throw new NotFoundException();
    }
}
