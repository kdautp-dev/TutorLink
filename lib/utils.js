export function formatDate(value) {
  if (!value) return "No date";

  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleString();
}

export function parseSubjects(input) {
  return input
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export function clampRating(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) return 0;

  return Math.min(5, Math.max(1, parsed));
}

export async function withTimeout(promise, timeoutMs, message) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function renderStars(value) {
  const numeric = Number(value) || 0;
  const rounded = Math.round(numeric);

  return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
}

export function getDisplayUsername(profile) {
  if (!profile) return "@member";

  if (profile.username) {
    return `@${String(profile.username).replace(/^@+/, "")}`;
  }

  if (profile.name) {
    const normalized = String(profile.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    if (normalized) {
      return `@${normalized}`;
    }
  }

  if (profile.id) {
    return `@user${String(profile.id).slice(0, 6)}`;
  }

  return "@member";
}

export function getBookmarkId(type, entityId) {
  return `${type}_${entityId}`;
}

export function sortBookmarks(items, sort) {
  const nextItems = [...items];

  if (sort === "deadline-soon") {
    return nextItems.sort((a, b) => {
      const left = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  }

  if (sort === "price-high") {
    return nextItems.sort((a, b) => Number(b.priceOffered || 0) - Number(a.priceOffered || 0));
  }

  if (sort === "price-low") {
    return nextItems.sort((a, b) => Number(a.priceOffered || 0) - Number(b.priceOffered || 0));
  }

  if (sort === "rate-high") {
    return nextItems.sort((a, b) => Number(b.hourlyRate || 0) - Number(a.hourlyRate || 0));
  }

  if (sort === "rate-low") {
    return nextItems.sort((a, b) => Number(a.hourlyRate || 0) - Number(b.hourlyRate || 0));
  }

  return nextItems.sort((a, b) => {
    const left = a.savedAt?.seconds || 0;
    const right = b.savedAt?.seconds || 0;
    return right - left;
  });
}
