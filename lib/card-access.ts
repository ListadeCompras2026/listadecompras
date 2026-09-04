import { CreditCardModel } from "@/lib/models/credit-card";
import { UserModel } from "@/lib/models/user";
import { toCreditCard } from "@/lib/credit-card-serializer";
import type { CreditCard, CreditCardMember } from "@/lib/types";

export function accessibleCardsFilter(userId: string) {
  return {
    $or: [{ createdBy: userId }, { sharedWith: userId }],
  };
}

export async function findAccessibleCard(userId: string, cardId: string) {
  return CreditCardModel.findOne({
    _id: cardId,
    ...accessibleCardsFilter(userId),
  });
}

async function membersForCards(
  docs: Array<{ createdBy: string; sharedWith?: string[] }>
): Promise<Map<string, CreditCardMember>> {
  const ids = [
    ...new Set(
      docs.flatMap((doc) => [doc.createdBy, ...(doc.sharedWith ?? [])])
    ),
  ].filter(Boolean);

  if (ids.length === 0) return new Map();

  const users = await UserModel.find({ _id: { $in: ids } })
    .select("name")
    .lean();

  return new Map(
    users.map((user) => [
      String(user._id),
      { id: String(user._id), name: user.name },
    ])
  );
}

export async function serializeCards(
  docs: Array<Parameters<typeof toCreditCard>[0]>,
  currentUserId: string
): Promise<CreditCard[]> {
  const names = await membersForCards(docs);
  return docs.map((doc) => {
    const sharedWith = doc.sharedWith ?? [];
    const memberIds = [doc.createdBy, ...sharedWith];
    return toCreditCard(doc, {
      sharedWith,
      members: memberIds.map((id) => names.get(id) ?? { id, name: "Usuário" }),
      isOwner: doc.createdBy === currentUserId,
      isShared: sharedWith.length > 0,
    });
  });
}

export async function serializeCard(
  doc: Parameters<typeof toCreditCard>[0],
  currentUserId: string
): Promise<CreditCard> {
  const [card] = await serializeCards([doc], currentUserId);
  return card;
}
