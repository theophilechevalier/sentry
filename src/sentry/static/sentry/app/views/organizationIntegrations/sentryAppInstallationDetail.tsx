import PropTypes from 'prop-types';
import React from 'react';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import SentryApplicationRow from 'app/views/settings/organizationDeveloperSettings/sentryApplicationRow';
import SentryTypes from 'app/sentryTypes';
import {t} from 'app/locale';
import {
  installSentryApp,
  uninstallSentryApp,
} from 'app/actionCreators/sentryAppInstallations';
import {Client} from 'app/api';
import {addQueryParamsToExistingUrl} from 'app/utils/queryString';
import {Organization, SentryApp, SentryAppInstallation} from 'app/types';
import {openModal} from 'app/actionCreators/modal';
import SplitInstallationIdModal from 'app/views/organizationIntegrations/SplitInstallationIdModal';
import {trackIntegrationEvent} from 'app/utils/integrationUtil';

type Props = {
  api: Client;
  organization: Organization;
  install?: SentryAppInstallation;
  app: SentryApp;
  onAppUninstall: () => void;
  onAppInstall: (install: SentryAppInstallation) => void;
};

class SentryAppInstallationDetail extends React.Component<Props> {
  static propTypes = {
    api: PropTypes.object,
    organization: SentryTypes.Organization.isRequired,
    install: PropTypes.object,
    app: PropTypes.object.isRequired,
    onAppUninstall: PropTypes.func.isRequired,
    onAppInstall: PropTypes.func.isRequired,
  };

  redirectUser = (install: SentryAppInstallation) => {
    const {organization, app} = this.props;

    trackIntegrationEvent(
      {
        eventKey: 'integrations.installation_start',
        eventName: 'Integrations: Installation Start',
        integration_type: 'sentry_app',
        integration: app.slug,
        view: 'integrations_page',
        integration_status: app.status,
      },
      this.props.organization
    );

    //installation is complete if the status is installed
    if (install.status === 'installed') {
      trackIntegrationEvent(
        {
          eventKey: 'integrations.installation_complete',
          eventName: 'Integrations: Installation Complete',
          integration_type: 'sentry_app',
          integration: app.slug,
          view: 'integrations_page',
          integration_status: app.status,
        },
        this.props.organization
      );
    }

    if (!app.redirectUrl) {
      addSuccessMessage(t(`${app.slug} successfully installed.`));
      this.props.onAppInstall(install);
    } else {
      const queryParams = {
        installationId: install.uuid,
        code: install.code,
        orgSlug: organization.slug,
      };
      const redirectUrl = addQueryParamsToExistingUrl(app.redirectUrl, queryParams);
      window.location.assign(redirectUrl);
    }

    //hack for split so we can show the install ID to users for them to copy
    //Will remove once the proper fix is in place
    if (['split', 'split-dev', 'split-testing'].includes(app.slug)) {
      openModal(({closeModal}) => (
        <SplitInstallationIdModal installationId={install.uuid} closeModal={closeModal} />
      ));
    }
  };

  handleInstall = () => {
    const {organization, api, app} = this.props;
    installSentryApp(api, organization.slug, app).then(
      install => {
        this.redirectUser(install);
      },
      () => {}
    );
  };

  handleUninstall = (install: SentryAppInstallation) => {
    const {api, app} = this.props;
    trackIntegrationEvent(
      {
        eventKey: 'integrations.uninstall_clicked',
        eventName: 'Integrations: Uninstall Clicked',
        integration: app.slug,
        integration_type: 'sentry_app',
        integration_status: app.status,
      },
      this.props.organization
    );

    uninstallSentryApp(api, install).then(
      () => {
        this.props.onAppUninstall();
        trackIntegrationEvent(
          {
            eventKey: 'integrations.uninstall_completed',
            eventName: 'Integrations: Uninstall Completed',
            integration: app.slug,
            integration_type: 'sentry_app',
            integration_status: app.status,
          },
          this.props.organization
        );
      },
      () => {
        addErrorMessage(t(`Unable to uninstall ${app.name}`));
      }
    );
  };

  render() {
    const {organization, install, app} = this.props;

    return (
      <React.Fragment>
        <SentryApplicationRow
          app={app}
          organization={organization}
          onInstall={this.handleInstall}
          onUninstall={this.handleUninstall}
          install={install}
          isOnIntegrationPage
        />
      </React.Fragment>
    );
  }
}

export default SentryAppInstallationDetail;
