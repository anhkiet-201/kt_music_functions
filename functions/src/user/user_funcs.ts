import {logger} from "firebase-functions/v1";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {generateShortID} from "../utils";
import {firestore, stripe} from "../global/global";
import {onCall} from "firebase-functions/v2/https";

export const subscriptionChange = onDocumentWritten(
  "/User/{uid}/payments/{paymentId}", async (event) => {
    const data = event.data?.after.data();
    if (data == undefined) {
      const userData = await firestore
        .collection("User")
        .doc(event.params.uid)
        .get();
      if (userData.data()?.paymentIntentId != event.params.paymentId) {
        return;
      }
      logger.info("Deleting plans");
      firestore
        .collection("User")
        .doc(event.params.uid)
        .set({subscription: null}, {merge: true});
      return;
    }
    const paymentIntent = {
      client_secret: data.client_secret,
      created: data.created,
      customer: data.customer,
      subscriptionId: data.description,
      status: data.status,
    };
    logger.info("Geting SubscriptionPlans");
    const rawData = await firestore
      .collection("SubscriptionPlans")
      .doc(paymentIntent.subscriptionId).get();
    const subscriptionPlans = rawData.data();
    let numPlanDays = 0;
    switch (subscriptionPlans?.type) {
    case "week": numPlanDays = 7; break;
    case "month": numPlanDays = 30; break;
    case "year": numPlanDays = 365; break;
    }
    logger.debug("paymentIntent status", paymentIntent.status);
    const status = paymentIntent.status == "succeeded" ? "paid" : "pending";
    const userSubscription = {
      expiredDate: Date.now() +
        (numPlanDays * subscriptionPlans?.availabilityTime * 86400000),
      id: generateShortID(),
      paidDate: Date.now(),
      paidStatus: status,
      paymentIntentId: event.params.paymentId,
      plans: subscriptionPlans,
    };
    logger.info("Update plans with" + userSubscription.paidStatus);
    firestore
      .collection("User")
      .doc(event.params.uid)
      .set({subscription: userSubscription}, {merge: true});
  });

export const createStripeIfNeed = onCall(async (request) => {
  try {
    const uid = request.auth?.uid;
    if (uid == undefined) {
      logger.error("User error");
      return;
    }
    const rawData = await firestore
      .collection("User")
      .doc(uid)
      .get();
    const userData = rawData.data();
    if (userData == undefined ||
            userData?.stripeId != undefined) {
      return;
    }
    logger.debug("Creating");
    await createCustomerRecord({
      email: userData.email,
      uid: userData.uuid,
      phone: userData.phone,
    });
  } catch (error) {
    logger.error(error);
  }
});

const createCustomerRecord = async ({
  email,
  uid,
  phone,
}: {
    email?: string;
    phone?: string;
    uid: string;
}) => {
  try {
    const customerData = {
      metadata: {
        firebaseUID: uid,
      },
      email: email,
      phone: phone,
    };
    const customer = await stripe.customers.create(customerData);

    // Add a mapping record in Cloud Firestore.
    const customerRecord = {
      email: customer.email,
      stripeId: customer.id,
      stripeLink: `https://dashboard.stripe.com${customer.livemode ? "" : "/test"
      }/customers/${customer.id}`,
    };
    if (phone) (customerRecord as any).phone = phone;
    firestore
      .collection("User")
      .doc(uid)
      .set(customerRecord, {merge: true});
    return customerRecord;
  } catch (error) {
    return null;
  }
};
