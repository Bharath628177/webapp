import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import { StatusMessage } from './StatusMessage';

interface QueryContentProps<T> {
  query: UseQueryResult<T>;
  notFoundMessage?: string;
  children: (data: T) => ReactNode;
}

/** The loading and error states every page needs, in one place. */
export function QueryContent<T>({ query, notFoundMessage, children }: QueryContentProps<T>) {
  if (query.isPending) {
    return <StatusMessage>Loading…</StatusMessage>;
  }
  if (query.isError) {
    const isNotFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <StatusMessage role="alert">
        {isNotFound && notFoundMessage
          ? notFoundMessage
          : 'Sorry, we could not load this right now. Please try again shortly.'}
      </StatusMessage>
    );
  }
  return <>{children(query.data)}</>;
}
