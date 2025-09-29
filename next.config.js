/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'uoffxmrnpukibgcmmgus.supabase.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        // Disable tempo-devtools in production
        if (!isServer && process.env.NODE_ENV === 'production') {
            config.resolve.alias = {
                ...config.resolve.alias,
                'tempo-devtools': false
            };
        }
        return config;
    }
};

if (process.env.NEXT_PUBLIC_TEMPO) {
    nextConfig.experimental = {
        ...nextConfig.experimental,
        // NextJS 13.4.8 up to 14.1.3:
        // swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
        // NextJS 14.1.3 to 14.2.11:
        swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]]

        // NextJS 15+ (Not yet supported, coming soon)
    }
}

module.exports = nextConfig;