/*global AcmeDomains _config*/

var AcmeDomains = window.AcmeDomains || {};
AcmeDomains.map = AcmeDomains.map || {};

(function rideScopeWrapper($) {
    var authToken;
    AcmeDomains.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestAcmeDomain(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your acmedomain:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var acmedomain;
        var pronoun;
        console.log('Response received from API: ', result);
        acmedomain = result.AcmeDomain;
        pronoun = acmedomain.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(acmedomain.Name + ', your ' + acmedomain.Color + ' acmedomain, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(acmedomain.Name + ' has arrived. Giddy up!');
            AcmeDomains.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(AcmeDomains.map).on('pickupChange', handlePickupChanged);

        AcmeDomains.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request AcmeDomain');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = AcmeDomains.map.selectedPoint;
        event.preventDefault();
        requestAcmeDomain(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = AcmeDomains.map.selectedPoint;
        var origin = {};

        if (dest.latitude > AcmeDomains.map.center.latitude) {
            origin.latitude = AcmeDomains.map.extent.minLat;
        } else {
            origin.latitude = AcmeDomains.map.extent.maxLat;
        }

        if (dest.longitude > AcmeDomains.map.center.longitude) {
            origin.longitude = AcmeDomains.map.extent.minLng;
        } else {
            origin.longitude = AcmeDomains.map.extent.maxLng;
        }

        AcmeDomains.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
