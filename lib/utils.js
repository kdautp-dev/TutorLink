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
