import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Crawl {

  @PrimaryGeneratedColumn()
  uid: number;

  @Column()
  page: string;

  @Column()
  title: string;
    
  @Column({default: () => false})
  isPrimary: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: string;

}