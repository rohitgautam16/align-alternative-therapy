import React from 'react';
import {
  useGetAuthSessionsQuery,
  useRevokeAuthSessionMutation,
  useRevokeOtherAuthSessionsMutation,
} from '../utils/api';
import {
  Smartphone,
  Laptop,
  Monitor,
  Globe,
  Terminal,
} from 'lucide-react';


export default function Devices() {
  const { data, isLoading, isError } = useGetAuthSessionsQuery();
  const [revokeSession, { isLoading: revokingOne }] =
    useRevokeAuthSessionMutation();
  const [revokeOthers, { isLoading: revokingOthers }] =
    useRevokeOtherAuthSessionsMutation();

  if (isLoading) {
    return <div className="p-4 text-gray-300">Loading devices…</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-400">Failed to load devices.</div>;
  }

  const sessions = data?.sessions || [];

  return (
    <div className="px-4 py-4 mx-auto">
      <header className="mb-4">
        <h1 className="text-lg font-semibold text-white">Devices</h1>
        <p className="text-sm text-gray-400">
          Manage where your account is signed in.
        </p>
      </header>

      <ul className="space-y-3">
  {sessions.map((session) => {
    const Icon = getDeviceIcon(session.userAgent);

    return (
      <li
        key={session.id}
        className="bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              size={18}
              className={`shrink-0 ${
                session.isCurrent
                  ? 'text-secondary'
                  : 'text-gray-400'
              }`}
            />

            <span className="text-sm font-medium text-white">
              {formatUserAgent(session.userAgent)}
            </span>
          </div>

          {session.isCurrent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-300">
              This device
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400 space-y-1 pl-8">
          <div>{session.ipAddress}</div>
          <div>
            Signed in {new Date(session.createdAt).toLocaleString()}
          </div>
          {session.lastUsedAt && (
            <div>
              Last active{' '}
              {new Date(session.lastUsedAt).toLocaleString()}
            </div>
          )}
        </div>

        {!session.isCurrent && (
          <button
            onClick={() => revokeSession(session.id)}
            disabled={revokingOne}
            className="
              self-start text-xs px-3 py-1 rounded-full
              border border-red-500 text-red-300
              hover:bg-red-500/10
              disabled:opacity-50
            "
          >
            Log out
          </button>
        )}
      </li>
    );
  })}
</ul>


      {sessions.length > 1 && (
        <button
          onClick={() => revokeOthers()}
          disabled={revokingOthers}
          className="mt-6 w-full py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-60"
        >
          Log out of all other devices
        </button>
      )}
    </div>
  );
}


function getDeviceIcon(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return Globe;
  }

  const ua = userAgent.toLowerCase();

  // Mobile
  if (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    return Smartphone;
  }

  // API / tooling
  if (ua.includes('postman') || ua.includes('curl')) {
    return Terminal;
  }

  // Desktop OS
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return Laptop;
  }

  // Browsers fallback
  if (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari')) {
    return Monitor;
  }

  return Globe;
}




function formatUserAgent(ua) {
  // Hard guard – never trust backend session data
  if (!ua || typeof ua !== 'string') {
    return 'Unknown device';
  }

  const agent = ua.toLowerCase();

  // Android model detection
  if (agent.includes('android')) {
    const match = agent.match(/android\s[\d.]+;\s([^;)]+)/i);
    return match?.[1]?.trim() || 'Android device';
  }

  if (agent.includes('postman')) return 'Postman';

  // iOS
  if (agent.includes('iphone')) return 'iPhone';
  if (agent.includes('ipad')) return 'iPad';

  // Desktop OS
  if (agent.includes('windows')) return 'Windows PC';
  if (agent.includes('macintosh')) return 'Mac';
  if (agent.includes('linux')) return 'Linux PC';

  // Browsers fallback
  if (agent.includes('chrome')) return 'Chrome browser';
  if (agent.includes('firefox')) return 'Firefox browser';
  if (agent.includes('safari')) return 'Safari browser';

  return 'Unknown device';
}
