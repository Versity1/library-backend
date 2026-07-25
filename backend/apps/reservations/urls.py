from django.urls import path
from .views import (
    ReserveBookView, MyReservationsView, QueueManagementView,
    CancelReservationView, FulfillReservationView,
)

urlpatterns = [
    path('reserve/', ReserveBookView.as_view(), name='reserve_book'),
    path('my-reservations/', MyReservationsView.as_view(), name='my_reservations'),
    path('queue/', QueueManagementView.as_view(), name='reservation_queue'),
    path('fulfill/', FulfillReservationView.as_view(), name='fulfill_reservation'),
    path('cancel/', CancelReservationView.as_view(), name='cancel_reservation_body'),
    path('<uuid:pk>/cancel/', CancelReservationView.as_view(), name='cancel_reservation'),
]
