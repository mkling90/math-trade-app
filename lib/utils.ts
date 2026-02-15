// Utility functions

/**
 * Generate a random invite code for a group
 * Returns an 8-character uppercase alphanumeric code
 */
export const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Export trades to a text file
 */
export const exportTradesToFile = (
  trades: any[],
  groupName: string
): void => {
  if (trades.length === 0) {
    alert('No trades to export. Please calculate trades first.');
    return;
  }

  let report = `MATH TRADE RESULTS\n`;
  report += `Group: ${groupName}\n`;
  report += `Date: ${new Date().toLocaleDateString()}\n`;
  report += `Total Trades: ${trades.length}\n`;
  report += `\n${'='.repeat(60)}\n\n`;

  trades.forEach((trade, index) => {
    report += `TRADE #${index + 1}: ${
      trade.type === 'direct' ? 'Direct Swap' : `${trade.chain.length}-Way Chain`
    }\n`;
    report += `${'-'.repeat(60)}\n`;

    trade.chain.forEach((step: any, stepIdx: number) => {
      report += `${stepIdx + 1}. ${step.from} gives "${step.fromGame}" → ${step.to} receives it\n`;
    });

    report += `\n`;
  });

  report += `${'='.repeat(60)}\n`;
  report += `End of Report\n`;

  // Create and download file
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `math-trade-${groupName.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
