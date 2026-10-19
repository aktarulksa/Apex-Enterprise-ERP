import { 
  AttendanceLedgerEntry, 
  AttendanceAuditLog, 
  AttendanceStatus, 
  Employee 
} from '../types/erp';

const STORAGE_KEYS = {
  LEDGER: 'apex_erp_attendance_ledger_v2',
  AUDIT: 'apex_erp_attendance_audit_v2'
};

/**
 * Checks if a date falls on a Saudi / Regional weekend (Friday or Saturday)
 * In JavaScript Date, 0 is Sunday, 5 is Friday, 6 is Saturday.
 */
export function isSaudiWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

export function getDayNameShort(date: Date): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[date.getDay()];
}

/**
 * Generates all days in a given YYYY-MM
 */
export function getDaysInMonth(year: number, month: number): Array<{
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Sun, Mon, etc.
  isWeekend: boolean;
}> {
  const lastDay = new Date(year, month, 0).getDate();
  const days = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      dateStr,
      dayName: getDayNameShort(dateObj),
      isWeekend: isSaudiWeekend(dateObj)
    });
  }

  return days;
}

/**
 * Generates initial baseline realistic seed ledger for a month
 */
export function generateInitialMonthLedger(
  year: number, 
  month: number, 
  employees: Employee[]
): AttendanceLedgerEntry[] {
  const days = getDaysInMonth(year, month);
  const entries: AttendanceLedgerEntry[] = [];

  employees.forEach(emp => {
    days.forEach(day => {
      let status: AttendanceStatus = day.isWeekend ? 'weekend' : 'present';
      let regularHours = day.isWeekend ? 0 : 8;
      let overtimeHours = 0;
      let notes = '';

      // Specific realistic seed records for demonstration & testing
      if (year === 2026 && month === 10) {
        // Faisal Al-Shammari
        if (emp.id === 'EMP-1006') {
          if (day.dayNumber === 1) {
            overtimeHours = 2.0;
            notes = 'NEOM Cloud sprint overtime';
          } else if (day.dayNumber === 2) {
            overtimeHours = 0;
            notes = '12m late traffic';
          } else if (day.dayNumber === 12) {
            overtimeHours = 1.5;
            notes = 'Maintenance release overtime';
          } else if (day.dayNumber >= 25 && day.dayNumber <= 27) {
            status = 'paid_leave';
            regularHours = 0;
            notes = 'Approved annual leave';
          }
        }

        // Maria Santos
        if (emp.id === 'EMP-1007') {
          if (day.dayNumber === 1) {
            overtimeHours = 2.5;
            notes = 'UI design system accessibility overtime';
          } else if (day.dayNumber === 18 || day.dayNumber === 19) {
            status = 'unpaid_leave';
            regularHours = 0;
            notes = 'Visa renewal overseas processing (Unpaid)';
          }
        }

        // David Chen
        if (emp.id === 'EMP-1003') {
          if (day.dayNumber === 6) {
            overtimeHours = 2.0;
            notes = 'Architecture review overtime';
          } else if (day.dayNumber === 11) {
            status = 'remote';
            notes = 'Remote working approved';
          }
        }

        // Omar Al-Ghamdi
        if (emp.id === 'EMP-1008') {
          if (day.dayNumber === 3) {
            // Worked night shift on Saturday
            status = 'present';
            regularHours = 8;
            overtimeHours = 0.67;
            notes = 'Night shift telemetry inspection';
          }
        }

        // Tariq Al-Otaibi
        if (emp.id === 'EMP-1004') {
          if (day.dayNumber === 14) {
            status = 'absent';
            regularHours = 0;
            notes = 'Unexcused medical appointment absence';
          }
        }
      }

      entries.push({
        id: `LEDGER-${emp.id}-${day.dateStr}`,
        employeeId: emp.id,
        date: day.dateStr,
        status,
        regularHours,
        overtimeHours,
        checkIn: regularHours > 0 ? '08:00' : undefined,
        checkOut: regularHours > 0 ? (overtimeHours > 0 ? `${17 + Math.floor(overtimeHours)}:${String(Math.round((overtimeHours % 1) * 60)).padStart(2, '0')}` : '17:00') : undefined,
        notes,
        updatedBy: 'System Bootstrap',
        updatedAt: '2026-10-01 08:00'
      });
    });
  });

  return entries;
}

/**
 * Attendance Ledger Repository
 */
class AttendanceLedgerRepo {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage error for ${key}:`, e);
    }
  }

  getLedger(year: number, month: number, employees: Employee[]): AttendanceLedgerEntry[] {
    const all = this.get<AttendanceLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthEntries = all.filter(e => e.date.startsWith(monthPrefix));

    if (monthEntries.length === 0 && employees.length > 0) {
      const initial = generateInitialMonthLedger(year, month, employees);
      const combined = [...all, ...initial];
      this.set(STORAGE_KEYS.LEDGER, combined);
      return initial;
    }

    return monthEntries;
  }

  saveLedgerEntries(entries: AttendanceLedgerEntry[]): void {
    const all = this.get<AttendanceLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    const entryMap = new Map<string, AttendanceLedgerEntry>();
    all.forEach(e => entryMap.set(e.id, e));
    entries.forEach(e => entryMap.set(e.id, e));
    this.set(STORAGE_KEYS.LEDGER, Array.from(entryMap.values()));
  }

  getAuditLogs(): AttendanceAuditLog[] {
    return this.get<AttendanceAuditLog[]>(STORAGE_KEYS.AUDIT, [
      {
        id: 'AUD-ATT-INIT-01',
        timestamp: '2026-10-01 08:00',
        employeeId: 'EMP-1006',
        employeeName: 'Faisal Al-Shammari',
        date: '2026-10-01',
        action: 'UPDATE',
        previousState: 'Regular: 8.0h, Overtime: 0.0h, Status: present',
        newState: 'Regular: 8.0h, Overtime: 2.0h, Status: present (NEOM Cloud sprint)',
        performedBy: 'David Chen (Supervisor)',
        userRole: 'supervisor',
        reason: 'Authorized sprint deploy overtime'
      },
      {
        id: 'AUD-ATT-INIT-02',
        timestamp: '2026-10-10 14:30',
        employeeId: 'EMP-1007',
        employeeName: 'Maria Santos',
        date: '2026-10-18',
        action: 'UPDATE',
        previousState: 'Regular: 8.0h, Status: present',
        newState: 'Regular: 0.0h, Status: unpaid_leave',
        performedBy: 'Sarah Mansoor (HR)',
        userRole: 'hr_manager',
        reason: 'Approved visa overseas leave without pay'
      }
    ]);
  }

  addAuditLog(log: AttendanceAuditLog): void {
    const logs = this.getAuditLogs();
    this.set(STORAGE_KEYS.AUDIT, [log, ...logs]);
  }
}

export const attendanceLedgerRepo = new AttendanceLedgerRepo();
