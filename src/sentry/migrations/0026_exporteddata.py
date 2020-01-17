# -*- coding: utf-8 -*-
# Generated by Django 1.10.8 on 2020-01-17 23:14
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import sentry.db.models.fields.bounded
import sentry.db.models.fields.foreignkey
import sentry.models.exporteddata


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Adding indexes to large tables. These indexes should be created concurrently,
    #   unfortunately we can't run migrations outside of a transaction until Django
    #   1.10. So until then these should be run manually.
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = False


    dependencies = [
        ('sentry', '0025_organizationaccessrequest_requester'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportedData',
            fields=[
                ('id', sentry.db.models.fields.bounded.BoundedBigAutoField(primary_key=True, serialize=False)),
                ('data_id', models.CharField(default=sentry.models.exporteddata.generate_data_id, max_length=32, unique=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('finished_at', models.DateTimeField(null=True)),
                ('expired_at', models.DateTimeField(null=True)),
                ('storage_url', models.URLField(null=True)),
                ('query_type', models.CharField(max_length=32)),
                ('query_info', models.TextField()),
                ('organization', sentry.db.models.fields.foreignkey.FlexibleForeignKey(on_delete=django.db.models.deletion.CASCADE, to='sentry.Organization')),
                ('user', sentry.db.models.fields.foreignkey.FlexibleForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'sentry_exporteddata',
            },
        ),
    ]
