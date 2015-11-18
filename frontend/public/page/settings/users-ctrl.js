angular.module('bridge.page')
.controller('UsersCtrl', function($scope, _, dex, authSvc, ModalLauncherSvc) {
  'use strict';
  var latestLoad = 0;
  $scope.reload = function () {
    var tooManyUsers = 1000;
    var batchSize = 100;
    var newUsers = [];
    var thisLoad, loadRemainingUsers;
    var authState = authSvc.state();

    $scope.yourId = authState ? authState.userID : null;
    $scope.users = null;
    $scope.userGroups = null;
    $scope.failed = false;

    latestLoad++;
    thisLoad = latestLoad;

    loadRemainingUsers = function(batch) {
      newUsers = newUsers.concat(batch.users);
      if (batch.nextPageToken && newUsers.length < tooManyUsers) {
        return dex.users.list({
          maxResults: batchSize,
          nextPageToken: batch.nextPageToken
        }).then(loadRemainingUsers);
      } else if (latestLoad === thisLoad) {
        $scope.userGroups = _.groupBy(newUsers, function(u) {
          if (u.disabled) {
            return 'disabled';
          }
          if (!u.emailVerified) {
            return 'invited';
          }
          return 'active';
        });
        $scope.users = newUsers;
      }
    };

    dex.users.list({maxResults: batchSize})
    .then(loadRemainingUsers)
    .catch(function(reason) {
      if (reason && reason.data && reason.data.error_description) {
        $scope.loadErrorMessage = reason.data.error_description;
      } else {
        $scope.loadErrorMessage = null;
      }
      $scope.failed = true;
    });
  };

  $scope.newUserModal = function() {
    var instance = ModalLauncherSvc.open('new-user', {});
    instance.result
    .then(function(results) {
      if (results.resetPasswordLink) {
        ModalLauncherSvc.open('new-user-invite-link', {
          link: results.resetPasswordLink
        });
      }
    })
    .then($scope.reload);
  };

  $scope.reload();
});
