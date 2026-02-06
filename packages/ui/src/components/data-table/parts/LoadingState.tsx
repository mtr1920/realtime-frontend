/**
 * LoadingState Component
 *
 * Displays skeleton rows while data is loading.
 */

import { Skeleton } from '../../skeleton';
import { tableCellVariants, tableRowVariants } from '../variants';
import type { TableDensity } from '../types';

export interface LoadingStateProps {
  /** Number of skeleton rows to show */
  rowCount?: number;
  /** Number of columns */
  colCount: number;
  /** Table density */
  density?: TableDensity;
}

export function LoadingState({
  rowCount = 5,
  colCount,
  density = 'default',
}: LoadingStateProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className={tableRowVariants({ density })}>
          {Array.from({ length: colCount }).map((_, colIndex) => (
            <td
              key={colIndex}
              className={tableCellVariants({ density })}
            >
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
