import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { AdminConfig } from '@/models/configModel';

export const GET = authRoute(['admin', 'clipteam', 'editor'], async (req) => {
  let adminConfig = await AdminConfig.findOne().lean();
  if (!adminConfig) {
    const newConfig = new AdminConfig();
    await newConfig.save();
    adminConfig = newConfig.toObject();
  }

  const configObj = adminConfig as Record<string, any>;
  return NextResponse.json({
    ...configObj,
    admin: configObj,
  });
});

export const PUT = authRoute(['admin'], async (req) => {
  const {
    denyThreshold,
    clipChannelIds,
    blacklistedSubmitters,
    blacklistedStreamers,
    seasonAutomation,
  } = await req.json();

  let adminConfig = await AdminConfig.findOne();
  if (!adminConfig) {
    adminConfig = new AdminConfig();
  }

  if (denyThreshold !== undefined) adminConfig.denyThreshold = denyThreshold;
  if (clipChannelIds !== undefined) adminConfig.clipChannelIds = clipChannelIds;
  if (blacklistedSubmitters !== undefined)
    adminConfig.blacklistedSubmitters = blacklistedSubmitters;
  if (blacklistedStreamers !== undefined)
    adminConfig.blacklistedStreamers = blacklistedStreamers;
  if (seasonAutomation !== undefined) {
    adminConfig.seasonAutomation = {
      ...(adminConfig.seasonAutomation || {}),
      ...seasonAutomation,
    };
  }

  await adminConfig.save();
  return NextResponse.json(adminConfig);
});
