// ============================================================
// STAYEASE HOTEL BOOKING SYSTEM
// GOOGLE ANALYTICS 4 - PRODUCTION EVENT TRACKING
// ============================================================
//
// This file tracks:
//
// 1. app_opened
// 2. navigation_click
// 3. room_selected
// 4. date_selected
// 5. booking_created
// 6. booking_updated
// 7. booking_edit_started
// 8. booking_cancelled
// 9. search
//
// IMPORTANT:
// Guest names, phone numbers, and search text are NOT sent
// to Google Analytics.
// ============================================================


// ============================================================
// GOOGLE ANALYTICS HELPER
// ============================================================

// Production tracking: do NOT send GA4 debug_mode events.
const GA_DEBUG_MODE = false;

function trackEvent(eventName, parameters = {}) {

    if (typeof window.gtag !== 'function') {

        console.warn(
            '[GA4] gtag is not available. Event was not sent:',
            eventName
        );

        return false;
    }

    const eventParameters = {
        ...parameters,
        ...(GA_DEBUG_MODE ? { debug_mode: true } : {})
    };

    try {
        window.gtag('event', eventName, eventParameters);

        console.info(
            '[GA4] Event sent:',
            eventName,
            eventParameters
        );

        return true;

    } catch (error) {

        console.error(
            '[GA4] Failed to send event:',
            eventName,
            error
        );

        return false;
    }
}


// ============================================================
// ROOM PRICES
// ============================================================

const roomPrices = {

    "Single": 3000,

    "Standard": 5000,

    "Family Suite": 7000,

    "Premium": 8000,

    "Presidential Suite": 15000,

    "Penthouse Suite": 20000

};


// ============================================================
// BOOKING DATA
// ============================================================

let bookings =
    JSON.parse(
        localStorage.getItem('bookings')
    ) || [];


let editingIndex = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

const form =
    document.getElementById('booking-form');


const submitBtn =
    document.getElementById('submit-btn');


const cancelEditBtn =
    document.getElementById('cancel-edit-btn');


const formTitle =
    document.getElementById('form-title');


const paymentInput =
    document.getElementById('payment');


const paymentDisplay =
    document.getElementById('payment-display');


const emptyState =
    document.getElementById('empty-state');


// ============================================================
// SAVE BOOKINGS
// ============================================================

function saveBookingsToLocalStorage() {

    localStorage.setItem(
        'bookings',
        JSON.stringify(bookings)
    );

}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(value) {

    return `₹${Number(value || 0).toLocaleString('en-IN')}`;

}


// ============================================================
// CALCULATE NIGHTS
// ============================================================

function calculateNights(
    checkInValue,
    checkOutValue
) {

    if (
        !checkInValue ||
        !checkOutValue
    ) {

        return 0;

    }


    const checkIn =
        new Date(
            `${checkInValue}T00:00:00`
        );


    const checkOut =
        new Date(
            `${checkOutValue}T00:00:00`
        );


    const difference =
        checkOut - checkIn;


    const nights =
        difference /
        (1000 * 60 * 60 * 24);


    return nights > 0
        ? nights
        : 0;

}


// ============================================================
// RESET FORM
// ============================================================

function resetForm() {

    form.reset();


    paymentInput.value = 0;


    paymentDisplay.textContent =
        '₹0';


    editingIndex = null;


    formTitle.textContent =
        'Book a room';


    submitBtn.textContent =
        'Book Room';


    cancelEditBtn.hidden =
        true;

}


// ============================================================
// CREATE / UPDATE BOOKING
// ============================================================

form.addEventListener(
    'submit',
    function(event) {

        event.preventDefault();


        const bookingData = {

            guestName:
                document
                    .getElementById('guest-name')
                    .value
                    .trim(),

            guestContact:
                document
                    .getElementById('guest-contact')
                    .value
                    .trim(),

            roomType:
                document
                    .getElementById('room-type')
                    .value,

            checkIn:
                document
                    .getElementById('check-in')
                    .value,

            checkOut:
                document
                    .getElementById('check-out')
                    .value,

            payment:
                paymentInput.value || 0

        };


        const nights =
            calculateNights(
                bookingData.checkIn,
                bookingData.checkOut
            );


        // ====================================================
        // UPDATE EXISTING BOOKING
        // ====================================================

        if (editingIndex !== null) {

            bookings[editingIndex] =
                bookingData;


            trackEvent(
                'booking_updated',
                {

                    room_type:
                        bookingData.roomType,

                    booking_value:
                        Number(
                            bookingData.payment || 0
                        ),

                    currency:
                        'INR',

                    nights:
                        nights

                }
            );

        }


        // ====================================================
        // CREATE NEW BOOKING
        // ====================================================

        else {

            bookings.push(
                bookingData
            );


            trackEvent(
                'booking_created',
                {

                    room_type:
                        bookingData.roomType,

                    booking_value:
                        Number(
                            bookingData.payment || 0
                        ),

                    currency:
                        'INR',

                    nights:
                        nights

                }
            );

        }


        // Save
        saveBookingsToLocalStorage();


        // Refresh UI
        displayBookings();


        updateSummary();


        // Reset
        resetForm();


        // Scroll to bookings
        document
            .getElementById(
                'bookings-section'
            )
            .scrollIntoView({

                behavior: 'smooth',

                block: 'start'

            });

    }
);


// ============================================================
// DISPLAY BOOKINGS
// ============================================================

function displayBookings(
    filteredBookings = bookings
) {

    const bookingsList =
        document.getElementById(
            'bookings-list'
        );


    const searchValue =
        document
            .getElementById(
                'current-booking-search'
            )
            .value
            .trim()
            .toLowerCase();


    bookingsList.innerHTML =
        filteredBookings
            .map(
                (booking) => {

                    const originalIndex =
                        bookings.indexOf(
                            booking
                        );


                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        booking.guestName
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    booking.guestContact
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    booking.roomType
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    booking.checkIn
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    booking.checkOut
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    booking.payment
                                )}
                            </td>

                            <td>

                                <button
                                    class="table-action"
                                    onclick="editBooking(${originalIndex})"
                                >
                                    Update
                                </button>

                                <button
                                    class="table-action delete"
                                    onclick="removeBooking(${originalIndex})"
                                >
                                    Cancel
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join('');


    const hasRows =
        filteredBookings.length > 0;


    emptyState.classList.toggle(
        'visible',
        !hasRows
    );


    emptyState
        .querySelector('h3')
        .textContent =
            searchValue
                ? 'No matching bookings'
                : 'No bookings yet';


    emptyState
        .querySelector('p')
        .textContent =
            searchValue
                ? 'Try a different guest name.'
                : 'Add your first reservation using the form above.';


    document
        .getElementById(
            'booking-count'
        )
        .textContent =
            `${filteredBookings.length} ${
                filteredBookings.length === 1
                    ? 'booking'
                    : 'bookings'
            }`;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value ?? '')
        .replace(
            /[&<>"']/g,
            char => ({

                '&': '&amp;',

                '<': '&lt;',

                '>': '&gt;',

                '"': '&quot;',

                "'": '&#039;'

            }[char])
        );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {

        return '—';

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    return date.toLocaleDateString(
        'en-IN',
        {

            day: '2-digit',

            month: 'short',

            year: 'numeric'

        }
    );

}


// ============================================================
// CALCULATE PAYMENT
// ============================================================

function calculatePayment() {

    const roomType =
        document
            .getElementById(
                'room-type'
            )
            .value;


    const checkInValue =
        document
            .getElementById(
                'check-in'
            )
            .value;


    const checkOutValue =
        document
            .getElementById(
                'check-out'
            )
            .value;


    if (
        !checkInValue ||
        !checkOutValue
    ) {

        paymentInput.value =
            0;

        paymentDisplay.textContent =
            '₹0';

        return;

    }


    const nights =
        calculateNights(
            checkInValue,
            checkOutValue
        );


    if (nights > 0) {

        const total =
            nights *
            roomPrices[roomType];


        paymentInput.value =
            total;


        paymentDisplay.textContent =
            formatCurrency(total);

    }

    else {

        paymentInput.value =
            0;


        paymentDisplay.textContent =
            '₹0';

    }

}


// ============================================================
// ROOM SELECTION EVENT
// ============================================================

document
    .getElementById(
        'room-type'
    )
    .addEventListener(
        'change',
        function() {

            calculatePayment();


            if (this.value) {

                trackEvent(
                    'room_selected',
                    {

                        room_type:
                            this.value,

                        room_price:
                            roomPrices[
                                this.value
                            ] || 0,

                        currency:
                            'INR'

                    }
                );

            }

        }
    );


// ============================================================
// CHECK-IN EVENT
// ============================================================

document
    .getElementById(
        'check-in'
    )
    .addEventListener(
        'change',
        function() {

            calculatePayment();


            if (this.value) {

                trackEvent(
                    'date_selected',
                    {

                        field:
                            'check_in'

                    }
                );

            }

        }
    );


// ============================================================
// CHECK-OUT EVENT
// ============================================================

document
    .getElementById(
        'check-out'
    )
    .addEventListener(
        'change',
        function() {

            calculatePayment();


            if (this.value) {

                trackEvent(
                    'date_selected',
                    {

                        field:
                            'check_out'

                    }
                );

            }

        }
    );


// ============================================================
// EDIT BOOKING
// ============================================================

function editBooking(index) {

    const booking =
        bookings[index];


    if (!booking) {

        return;

    }


    document
        .getElementById(
            'guest-name'
        )
        .value =
            booking.guestName;


    document
        .getElementById(
            'guest-contact'
        )
        .value =
            booking.guestContact;


    document
        .getElementById(
            'room-type'
        )
        .value =
            booking.roomType;


    document
        .getElementById(
            'check-in'
        )
        .value =
            booking.checkIn;


    document
        .getElementById(
            'check-out'
        )
        .value =
            booking.checkOut;


    paymentInput.value =
        booking.payment;


    paymentDisplay.textContent =
        formatCurrency(
            booking.payment
        );


    editingIndex =
        index;


    formTitle.textContent =
        'Update booking';


    submitBtn.textContent =
        'Update Booking';


    cancelEditBtn.hidden =
        false;


    // GA4
    trackEvent(
        'booking_edit_started',
        {

            room_type:
                booking.roomType,

            booking_value:
                Number(
                    booking.payment || 0
                ),

            currency:
                'INR'

        }
    );


    document
        .getElementById(
            'booking-form-section'
        )
        .scrollIntoView({

            behavior: 'smooth',

            block: 'start'

        });

}


// ============================================================
// CANCEL EDIT
// ============================================================

cancelEditBtn.addEventListener(
    'click',
    resetForm
);


// ============================================================
// CANCEL BOOKING
// ============================================================

function removeBooking(index) {

    if (!bookings[index]) {

        return;

    }


    const booking =
        bookings[index];


    const guestName =
        booking.guestName;


    if (
        !confirm(
            `Cancel the booking for ${guestName}?`
        )
    ) {

        return;

    }


    // GA4
    trackEvent(
        'booking_cancelled',
        {

            room_type:
                booking.roomType,

            booking_value:
                Number(
                    booking.payment || 0
                ),

            currency:
                'INR',

            nights:
                calculateNights(
                    booking.checkIn,
                    booking.checkOut
                )

        }
    );


    bookings.splice(
        index,
        1
    );


    saveBookingsToLocalStorage();


    displayBookings();


    updateSummary();


    if (
        editingIndex === index
    ) {

        resetForm();

    }

}


// ============================================================
// SEARCH
// ============================================================

let lastTrackedSearchTerm =
    '';


function searchCurrentBookings() {

    const searchValue =
        document
            .getElementById(
                'current-booking-search'
            )
            .value
            .toLowerCase()
            .trim();


    const filteredBookings =
        bookings.filter(
            booking =>

                booking.guestName
                    .toLowerCase()
                    .includes(
                        searchValue
                    )
        );


    displayBookings(
        filteredBookings
    );


    // Track search activity without sending the actual
    // search text. The search can contain a guest's name,
    // so the query itself must not be sent to Analytics.

    if (
        searchValue &&
        searchValue !==
            lastTrackedSearchTerm
    ) {

        trackEvent(
            'search',
            {
                results_count:
                    filteredBookings.length
            }
        );

    }


    lastTrackedSearchTerm =
        searchValue;

}


// ============================================================
// UPDATE SUMMARY
// ============================================================

function updateSummary() {

    const totalBookings =
        bookings.length;


    const totalPayment =
        bookings.reduce(
            (sum, booking) =>

                sum +
                Number(
                    booking.payment || 0
                ),

            0
        );


    document
        .getElementById(
            'summary-total-value'
        )
        .textContent =
            totalBookings.toLocaleString(
                'en-IN'
            );


    document
        .getElementById(
            'summary-payment-value'
        )
        .textContent =
            formatCurrency(
                totalPayment
            );

}


// ============================================================
// NAVIGATION TRACKING
// ============================================================

document
    .querySelectorAll(
        'nav a'
    )
    .forEach(
        link => {

            link.addEventListener(
                'click',
                function() {

                    trackEvent(
                        'navigation_click',
                        {

                            destination:
                                this.textContent
                                    .trim()
                                    .toLowerCase()

                        }
                    );

                }
            );

        }
    );


// ============================================================
// APP OPENED
// ============================================================

trackEvent(
    'app_opened',
    {

        page_title:
            document.title,

        page_location:
            window.location.href

    }
);


// ============================================================
// INITIALIZE
// ============================================================

displayBookings();

updateSummary();