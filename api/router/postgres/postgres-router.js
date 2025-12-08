import { Router } from "express";

import authRouter from "./auth.js";
import userRouter from "./user.js";
import businessRouter from "./business.js";
import membershipRouter from "./membership.js";
import metaConnectorRouter from "./meta-connector.js";
import metaBusinessManagerRouter from "./meta-business-manager.js";
import metaBusinessManagerSnapshotRouter from "./meta-business-manager-snapshot.js";
import metaAdAccountRouter from "./meta-ad-account.js";
import metaAdAccountSnapshotRouter from "./meta-ad-account-snapshot.js";
import metaCampaignRouter from "./meta-campaign.js";
import metaCampaignSnapshotRouter from "./meta-campaign-snapshot.js";
import metaAdsetRouter from "./meta-adset.js";
import metaAdsetSnapshotRouter from "./meta-adset-snapshot.js";
import metaAdRouter from "./meta-ad.js";
import metaAdSnapshotRouter from "./meta-ad-snapshot.js";
import metaMetricsRouter from "./meta-metrics.js";

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(businessRouter);
router.use(membershipRouter);
router.use(metaConnectorRouter);
router.use(metaBusinessManagerRouter);
router.use(metaBusinessManagerSnapshotRouter);
router.use(metaAdAccountRouter);
router.use(metaAdAccountSnapshotRouter);
router.use(metaCampaignRouter);
router.use(metaCampaignSnapshotRouter);
router.use(metaAdsetRouter);
router.use(metaAdsetSnapshotRouter);
router.use(metaAdRouter);
router.use(metaAdSnapshotRouter);
router.use(metaMetricsRouter);

export default router;
