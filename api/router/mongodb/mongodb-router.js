import { Router } from "express";

import authRouter from "./auth.js";
import userRouter from "./user.js";
import businessRouter from "./business.js";
import membershipRouter from "./membership.js";
import metaConnectorRouter from "./meta-connector.js";
import metaBusinessManagerRouter from "./meta-business-manager.js";
import metaAdAccountRouter from "./meta-ad-account.js";
import metaCampaignRouter from "./meta-campaign.js";
import metaAdsetRouter from "./meta-adset.js";
import metaAdRouter from "./meta-ad.js";
import metaMetricsRouter from "./meta-metrics.js";

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(businessRouter);
router.use(membershipRouter);
router.use(metaConnectorRouter);
router.use(metaBusinessManagerRouter);
router.use(metaAdAccountRouter);
router.use(metaCampaignRouter);
router.use(metaAdsetRouter);
router.use(metaAdRouter);
router.use(metaMetricsRouter);

export default router;
