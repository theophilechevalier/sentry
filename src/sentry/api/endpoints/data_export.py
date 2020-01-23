from __future__ import absolute_import

from rest_framework.response import Response

# from sentry import features
from sentry.api.base import Endpoint
from sentry.api.bases.incident import IncidentPermission
from sentry.models import ExportedData


class DataExportEndpoint(Endpoint):
    permission_classes = (IncidentPermission,)

    def post(self, organization, *args, **kwargs):
        """
        Create a new Asynchronous file export task, and
        email user upon completion,
        """

        # TODO(Leander): Hide behind a feature flag
        # if not features.has("organizations:data-export", organization):
        #     return Response(status=404)

        try:
            # TODO(Leander): Setup .delay reference to celery task.
            return
        except ExportedData.DoesNotExist:
            return Response(status=404)
