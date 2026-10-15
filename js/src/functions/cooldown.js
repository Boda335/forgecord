const { Interaction, Collection } = require('discord.js');
/**
 *
 * @param {Interaction} interaction
 * @param {String} cmd
 */
function cooldown(interaction, cmd) {
  if (!interaction || !cmd) return;
  const { client, user } = interaction;
  if (!client.cooldowns.has(cmd.name)) {
    client.cooldowns.set(cmd.name, new Collection());
  }
  const now = Date.now();
  const timestamps = client.cooldowns.get(cmd.name);
  // cmd.cooldown is expected in milliseconds (e.g. ms('10s'), ms('1m')).
  const cooldownAmount = cmd.cooldown;
  if (timestamps.has(user.id)) {
    const expirationTime = timestamps.get(user.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    } else {
      timestamps.set(user.id, now);
      setTimeout(() => timestamps.delete(user.id), cooldownAmount);
      return false;
    }
  } else {
    timestamps.set(user.id, now);
    setTimeout(() => timestamps.delete(user.id), cooldownAmount);
    return false;
  }
}
module.exports = cooldown;
