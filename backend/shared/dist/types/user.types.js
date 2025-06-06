"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PERMISSIONS = void 0;
const common_types_1 = require("./common.types");
exports.DEFAULT_PERMISSIONS = {
    [common_types_1.UserRole.ADMIN]: [
        'users:read',
        'users:write',
        'users:delete',
        'doctors:read',
        'doctors:write',
        'doctors:delete',
        'patients:read',
        'patients:write',
        'patients:delete',
        'appointments:read',
        'appointments:write',
        'appointments:delete',
        'medical-records:read',
        'medical-records:write',
        'medical-records:delete',
        'prescriptions:read',
        'prescriptions:write',
        'prescriptions:delete',
        'billing:read',
        'billing:write',
        'billing:delete',
        'reports:read',
        'system:manage'
    ],
    [common_types_1.UserRole.DOCTOR]: [
        'profile:read',
        'profile:write',
        'patients:read',
        'appointments:read',
        'appointments:write',
        'medical-records:read',
        'medical-records:write',
        'prescriptions:read',
        'prescriptions:write',
        'schedule:read',
        'schedule:write'
    ],
    [common_types_1.UserRole.PATIENT]: [
        'profile:read',
        'profile:write',
        'appointments:read',
        'appointments:write',
        'medical-records:read',
        'prescriptions:read',
        'billing:read'
    ],
    [common_types_1.UserRole.NURSE]: [
        'profile:read',
        'profile:write',
        'patients:read',
        'patients:write',
        'appointments:read',
        'medical-records:read',
        'medical-records:write',
        'prescriptions:read'
    ],
    [common_types_1.UserRole.RECEPTIONIST]: [
        'profile:read',
        'profile:write',
        'patients:read',
        'patients:write',
        'appointments:read',
        'appointments:write',
        'billing:read'
    ]
};
//# sourceMappingURL=user.types.js.map