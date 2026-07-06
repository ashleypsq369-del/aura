"""
Role-Based Access Control (RBAC) Middleware
"""

from fastapi import HTTPException, status, Depends
from typing import List
from middleware.auth_middleware import get_current_user_role


# Role hierarchy and permissions
ROLE_PERMISSIONS = {
    "admin": ["all"],
    "clinician": [
        "patients:read", "patients:write",
        "vitals:read", "vitals:write",
        "symptoms:read", "symptoms:write",
        "ai:read", "ai:write",
        "alerts:read", "alerts:write",
        "medications:read", "medications:write",
        "appointments:read", "appointments:write",
        "caregivers:read", "caregivers:write"
    ],
    "caregiver": [
        "patients:read",
        "medications:read", "medications:write",
        "appointments:read", "appointments:write",
        "caregivers:read"
    ],
    "patient": [
        "vitals:write",
        "symptoms:write",
        "bereavement:read", "bereavement:write"
    ],
    "family": [
        "patients:read",
        "bereavement:read", "bereavement:write"
    ]
}


def check_permission(required_permission: str, user_role: str) -> bool:
    """Check if user role has required permission"""
    if user_role == "admin":
        return True
    
    role_perms = ROLE_PERMISSIONS.get(user_role, [])
    return required_permission in role_perms


def require_role(allowed_roles: List[str]):
    """Dependency to require specific roles"""
    async def role_checker(role: str = Depends(get_current_user_role)):
        if role not in allowed_roles and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return role
    return role_checker


def require_permission(permission: str):
    """Dependency to require specific permission"""
    async def permission_checker(role: str = Depends(get_current_user_role)):
        if not check_permission(permission, role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {permission}"
            )
        return role
    return permission_checker
