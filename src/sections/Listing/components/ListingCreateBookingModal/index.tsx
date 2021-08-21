import React from "react";
import { useMutation } from "@apollo/client";
import { Modal, Button, Divider, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import moment, { Moment } from "moment";
import { CREATE_BOOKING } from "../../../../lib/graphql/mutations/CreateBooking";
import {
  CreateBooking as CreateBookingData,
  CreateBookingVariables,
} from "../../../../lib/graphql/mutations/CreateBooking/__generated__/CreateBooking";
import {
  formatListingPrice,
  displayErrorMessage,
  displaySuccessNotification,
} from "../../../../lib/utils";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface Props {
  id: string;
  price: number;
  checkInDate: Moment;
  checkOutDate: Moment;
  modalVisible: boolean;
  setModalVisible: (modalVisible: boolean) => void;
  clearBookingData: () => void;
  handleListingRefetch: () => Promise<void>;
}

const { Paragraph, Text, Title } = Typography;

export const ListingCreateBookingModal = ({
  id,
  price,
  modalVisible,
  setModalVisible,
  checkInDate,
  checkOutDate,
  clearBookingData,
  handleListingRefetch,
}: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const daysBooked = checkOutDate.diff(checkInDate, "days") + 1;
  const listingPrice = price * daysBooked;
  const [createBooking, { loading }] = useMutation<
    CreateBookingData,
    CreateBookingVariables
  >(CREATE_BOOKING, {
    onCompleted: () => {
      clearBookingData();
      displaySuccessNotification(
        "You've succesfully booked the listing",
        "Booking history can alwas be found in your User Page."
      );
      handleListingRefetch();
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to successfully book the listing. Please try again later!"
      );
    },
  });

  const handleCreateBooking = async () => {
    if (!stripe || !elements) {
      return displayErrorMessage(
        "Sorry! We weren't able to connect with Stripe."
      );
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      return;
    }

    let { token: stripeToken, error } = await stripe.createToken(cardElement);
    if (stripeToken) {
      createBooking({
        variables: {
          input: {
            id,
            source: stripeToken.id,
            checkIn: moment(checkInDate).format("YYYY-MM-DD"),
            checkOut: moment(checkOutDate).format("YYYY-MM-DD"),
          },
        },
      });
    } else {
      displayErrorMessage(
        error && error.message
          ? error.message
          : "Sorry! We weren't able to book the listing. Please try again later."
      );
    }
  };

  return (
    <Modal
      visible={modalVisible}
      centered
      footer={null}
      onCancel={() => setModalVisible(false)}
    >
      <div className="listing-booking-modal">
        <div className="listing-booking-modal__intro">
          <Title className="listing-booking-modal__intro-title">
            <KeyOutlined />
          </Title>
          <Title level={3} className="listing-booking-modal__intro-title">
            Book your trip
          </Title>
          <Paragraph>
            Enter your payment information to book the listing from the dates
            between{" "}
            <Text strong mark>
              {moment(checkInDate).format("MMMM Do YYYY")}
            </Text>{" "}
            and{" "}
            <Text strong mark>
              {moment(checkOutDate).format("MMMM Do YYYY")}
            </Text>{" "}
            inclusive.
          </Paragraph>
        </div>
        <Divider />

        <div className="listing-booking-modal__charge-summary">
          <Paragraph>
            {formatListingPrice(price, false)} * {daysBooked} days ={" "}
            <Text strong>{formatListingPrice(listingPrice, false)} </Text>
          </Paragraph>

          <Paragraph className="listing-booking-modal__charge-summary-total">
            Total = <Text mark>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
        </div>

        <Divider />
        <div className="listing-booking-modal__sripe-card-section">
          <CardElement
            className="listing-booking-modal__stripe-card"
            options={{ hidePostalCode: true }}
          />
          <Button
            size="large"
            type="primary"
            className="listing-booking-modal__cta"
            loading={loading}
            onClick={handleCreateBooking}
          >
            Book
          </Button>
        </div>
      </div>
    </Modal>
  );
};
