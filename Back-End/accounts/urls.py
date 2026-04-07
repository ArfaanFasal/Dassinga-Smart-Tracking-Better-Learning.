from django.urls import re_path

from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LoginView,
    LogoutView,
    RegisterView,
)


urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="auth-register"),
    re_path(r"^login/?$", LoginView.as_view(), name="auth-login"),
    re_path(r"^token/?$", CustomTokenObtainPairView.as_view(), name="token-obtain-pair"),
    re_path(r"^refresh/?$", CustomTokenRefreshView.as_view(), name="token-refresh"),
    re_path(r"^logout/?$", LogoutView.as_view(), name="auth-logout"),
]
