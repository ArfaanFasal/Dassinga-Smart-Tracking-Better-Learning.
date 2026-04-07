from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    photoDataUrl = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "name",
            "email",
            "role",
            "enabled",
            "phone",
            "course",
            "profile_image",
            "photoDataUrl",
            "created_at",
        )

    def get_profile_image(self, obj):
        return obj.profile_image or ""

    def get_photoDataUrl(self, obj):
        return self.get_profile_image(obj)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ("name", "email", "password", "phone", "course", "profile_image", "role")

    def create(self, validated_data):
        validated_data.pop("role", None)
        validated_data["role"] = "student"
        validated_data["enabled"] = True
        try:
            return User.objects.create_user(**validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError({"email": "Email already registered"}) from exc


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        if not user.enabled:
            raise serializers.ValidationError("Account disabled by admin")
        attrs["user"] = user
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["enabled"] = user.enabled
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user, context={"request": self.context.get("request")}).data
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    profile_image = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("name", "email", "phone", "course", "profile_image")

    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email already in use")
        return value


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("name", "email", "password", "role", "phone", "course", "enabled")

    def validate_role(self, value):
        if value not in {"student", "teacher", "admin"}:
            raise serializers.ValidationError("Role must be student, teacher, or admin")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ("name", "email", "role", "enabled", "phone", "course", "password")

    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


def issue_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}
