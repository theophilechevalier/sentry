import {uniqueId} from 'app/utils/guid';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import {Organization} from 'app/types';
import {Hooks} from 'app/types/hooks';

const INTEGRATIONS_ANALYTICS_SESSION_KEY = 'integrationsAnalyticsSession';

export const startAnalyticsSession = () => {
  const sessionId = uniqueId();
  window.sessionStorage.setItem(INTEGRATIONS_ANALYTICS_SESSION_KEY, sessionId);
  return sessionId;
};

export const clearAnalyticsSession = () => {
  window.sessionStorage.removeItem(INTEGRATIONS_ANALYTICS_SESSION_KEY);
};

export const getAnalyticsSessionId = () => {
  return window.sessionStorage.getItem(INTEGRATIONS_ANALYTICS_SESSION_KEY);
};

type ModalOpenEvent = {
  eventKey: 'integrations.install_modal_opened';
  eventName: 'Integrations: Install Modal Opened';
  already_installed: boolean; //need this field for the modal open event but not other events
};

type OtherSingleIntegrationEvents = {
  eventKey:
    | 'integrations.installation_start'
    | 'integrations.installation_complete'
    | 'integrations.details_viewed'
    | 'integrations.uninstall_clicked'
    | 'integrations.uninstall_completed'
    | 'integrations.enabled'
    | 'integrations.disabled'
    | 'integrations.config_saved';
  eventName:
    | 'Integrations: Installation Start'
    | 'Integrations: Installation Complete'
    | 'Integrations: Details Viewed'
    | 'Integrations: Uninstall Clicked'
    | 'Integrations: Uninstall Completed'
    | 'Integrations: Enabled'
    | 'Integrations: Disabled'
    | 'Integrations: Config Saved';
};

type SentryAppEvent = {
  integration_type: 'sentry_app';
  //include the status since people might do weird things testing unpublished integrations
  integration_status: 'published' | 'unpublished' | 'internal';
};

type NonSentryAppEvent = {
  integration_type: 'plugin' | 'first_party';
};

type SingleIntegrationEvent = (ModalOpenEvent | OtherSingleIntegrationEvents) &
  (SentryAppEvent | NonSentryAppEvent) & {
    integration: string; //the slug
  };

type MultipleIntegrationsEvent = {
  eventKey: 'integrations.index_viewed';
  eventName: 'Integrations: Index Page Viewed';
  integrations_installed: number;
};

type IntegrationsEventParams = (MultipleIntegrationsEvent | SingleIntegrationEvent) & {
  view?:
    | 'external_install'
    | 'integrations_page'
    | 'legacy_integrations'
    | 'plugin_details'
    | 'integrations_directory';
  project_id?: string;
} & Parameters<Hooks['analytics:track-event']>[0];

/**
 * Tracks an event for ecosystem analytics
 * Must be tied to an organization
 * Uses the current session ID or generates a new one if startSession == true
 */
export const trackIntegrationEvent = (
  analyticsParams: IntegrationsEventParams,
  org?: Organization, //we should pass in org whenever we can but not every place guarantees this
  options?: {startSession: boolean}
) => {
  const {startSession} = options || {};
  let sessionId = startSession ? startAnalyticsSession() : getAnalyticsSessionId();

  //we should always have a session id but if we don't, we should generate one
  if (!sessionId) {
    // eslint-disable-next-line no-console
    console.warn(`analytics_session_id absent from event ${analyticsParams.eventName}`);
    sessionId = startAnalyticsSession();
  }

  const params = {
    analytics_session_id: sessionId,
    organization_id: org?.id,
    role: org?.role,
    integration_directory_active: false, //TODO: should be configurable
    ...analyticsParams,
  };

  //add the integration_status to the type of params so TS doesn't complain about what we do below
  const fullParams: typeof params & {
    integration_status?: string;
  } = params;

  //Reload expects integration_status even though it's not relevant for non-sentry apps
  //Passing in a dummy value of published in those cases
  if (analyticsParams.integration && analyticsParams.integration_type !== 'sentry_app') {
    fullParams.integration_status = 'published';
  }

  //TODO(steve): remove once we pass in org always
  if (!org) {
    // eslint-disable-next-line no-console
    console.warn(`Organization absent from event ${analyticsParams.eventName}`);
  }

  //could put this into a debug method or for the main trackAnalyticsEvent event
  if (window.localStorage.getItem('DEBUG') === '1') {
    // eslint-disable-next-line no-console
    console.log('trackIntegrationEvent', fullParams);
  }
  return trackAnalyticsEvent(fullParams);
};
