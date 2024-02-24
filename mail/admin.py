from django.contrib import admin
from mail.models import User


class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "is_staff")


# Register your models here.
admin.site.register(User, UserAdmin)