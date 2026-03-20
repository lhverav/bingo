/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bingo/shared', '@bingo/domain', '@bingo/game-core'],
};

module.exports = nextConfig;
