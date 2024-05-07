import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import Stripe from "stripe";

export const app = initializeApp();
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const firestore = getFirestore();
export const storage = getStorage(app);
