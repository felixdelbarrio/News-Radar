// A delivery date after the availability grace period, independent of the host calendar.
export class TestDate extends globalThis.Date{
 constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00Z']));}
 static now(){return new globalThis.Date('2026-10-15T12:00:00Z').getTime();}
}
